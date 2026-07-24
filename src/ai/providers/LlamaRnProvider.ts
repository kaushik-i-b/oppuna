/**
 * llama.rn / llama.cpp provider — inference only.
 *
 * Model discovery, integrity, and lifecycle orchestration live in modelManager.
 * This class must not call cloud APIs, Ollama, or perform network I/O.
 *
 * Native initLlama is globally single-flight:
 * - Logical attempts may time out / become stale immediately.
 * - A second initLlama MUST NOT start until the prior native Promise settles.
 * - Stale resolutions release the returned context and never become ready.
 */

import { Platform } from 'react-native';
import { initLlama, type LlamaContext, type NativeCompletionResult, type TokenData } from 'llama.rn';

import {
  LOCAL_MODEL_CONFIG,
  LOCAL_MODEL_STOP_SEQUENCES,
} from '@/config/localModel';
import { getDeviceCapability } from '@/services/deviceCapabilityService';
import { logger } from '@/utils/logger';
import type {
  ChatMessage,
  GenerationOptions,
  LocalLLMProvider,
  LocalLLMProviderStatus,
  TokenCallback,
} from '@/ai/providers/LocalLLMProvider';
import { LocalLLMProviderError } from '@/ai/providers/LocalLLMProvider';

export interface LlamaRnProviderOptions {
  /** Absolute filesystem path or file:// URI to the GGUF model. */
  modelPath: string;
  contextSize?: number;
  nGpuLayers?: number;
  nThreads?: number;
  useMlock?: boolean;
}

function toFileUri(path: string): string {
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
}

function isOomError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /out of memory|oom|ENOMEM|Failed to allocate/i.test(message);
}

function mapNativeError(error: unknown, fallbackCode: LocalLLMProviderError['code']): LocalLLMProviderError {
  if (error instanceof LocalLLMProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (isOomError(error)) {
    return new LocalLLMProviderError(`Out of memory: ${message}`, 'oom', error);
  }
  return new LocalLLMProviderError(message, fallbackCode, error);
}

/**
 * Global native-init gate shared across ALL LlamaRnProvider instances.
 * Clearing a logical initPromise must NOT allow a second initLlama while
 * the first underlying native call is still unresolved.
 */
let nativeInitChain: Promise<void> = Promise.resolve();
let activeNativeInitPromise: Promise<LlamaContext> | null = null;
let nativeInitStarts = 0;

/** @internal Test helpers */
export function __getNativeInitStartsForTests(): number {
  return nativeInitStarts;
}
export function __resetNativeInitGateForTests(): void {
  // Force-resolve any abandoned gate from interrupted tests, then reset.
  nativeInitChain = Promise.resolve();
  activeNativeInitPromise = null;
  nativeInitStarts = 0;
}
export function __getActiveNativeInitPromiseForTests(): Promise<LlamaContext> | null {
  return activeNativeInitPromise;
}

export class LlamaRnProvider implements LocalLLMProvider {
  readonly id = 'llama.rn';
  readonly displayName = 'llama.rn (llama.cpp)';

  private readonly modelPath: string;
  private readonly contextSize: number;
  private readonly nGpuLayers: number;
  private readonly nThreads: number;
  private readonly useMlock: boolean;

  private context: LlamaContext | null = null;
  private status: LocalLLMProviderStatus = 'uninitialized';
  /** Logical init promise for concurrent callers on THIS instance. */
  private logicalInitPromise: Promise<void> | null = null;
  private generating = false;
  private cancelRequested = false;
  private initAttemptId = 0;
  private initCanceled = false;

  constructor(options: LlamaRnProviderOptions) {
    const capability = getDeviceCapability();
    this.modelPath = options.modelPath;
    this.contextSize = options.contextSize ?? capability.recommendedContextSize;
    this.nGpuLayers = options.nGpuLayers ?? capability.recommendedGpuLayers;
    this.nThreads = options.nThreads ?? capability.recommendedThreads;
    this.useMlock = options.useMlock ?? false;
  }

  getStatus(): LocalLLMProviderStatus {
    return this.status;
  }

  isReady(): boolean {
    return this.context !== null && (this.status === 'ready' || this.status === 'generating');
  }

  getContextSize(): number {
    return this.contextSize;
  }

  getModelPath(): string {
    return this.modelPath;
  }

  /** @internal Test/diagnostic accessor for active init attempt. */
  getInitAttemptId(): number {
    return this.initAttemptId;
  }

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      this.status = 'failed';
      throw new LocalLLMProviderError('llama.rn is not available on web', 'unavailable');
    }

    if (this.context && this.status === 'ready') {
      return;
    }

    // Single-flight per instance: concurrent callers share the same logical op.
    if (this.logicalInitPromise) {
      return this.logicalInitPromise;
    }

    const attemptId = ++this.initAttemptId;
    this.initCanceled = false;
    this.status = 'initializing';
    this.logicalInitPromise = this.loadContext(attemptId);
    try {
      await this.logicalInitPromise;
    } finally {
      // Logical promise may clear while native work is still gated globally.
      this.logicalInitPromise = null;
    }
  }

  private isInitAttemptCurrent(attemptId: number): boolean {
    return !this.initCanceled && attemptId === this.initAttemptId;
  }

  private async releaseContextQuietly(context: LlamaContext): Promise<void> {
    try {
      await context.release();
    } catch (error) {
      logger.warn('Failed to release stale llama.rn context', { error: String(error) });
    }
  }

  /**
   * Runs initLlama under the global native gate so overlapping loads cannot start.
   */
  private enqueueNativeInit(): Promise<LlamaContext> {
    let release!: () => void;
    const previous = nativeInitChain;
    nativeInitChain = new Promise<void>((resolve) => {
      release = resolve;
    });

    const run = (async (): Promise<LlamaContext> => {
      await previous;
      nativeInitStarts += 1;
      const nativePromise = initLlama({
        model: toFileUri(this.modelPath),
        use_mmap: true,
        use_mlock: this.useMlock,
        n_ctx: this.contextSize,
        n_threads: this.nThreads,
        n_gpu_layers: this.nGpuLayers,
      });
      activeNativeInitPromise = nativePromise;
      try {
        return await nativePromise;
      } finally {
        if (activeNativeInitPromise === nativePromise) {
          activeNativeInitPromise = null;
        }
        release();
      }
    })();

    // Ensure gate advances even if run rejects before finally (defense in depth).
    run.catch(() => undefined);
    return run;
  }

  private async loadContext(attemptId: number): Promise<void> {
    let context: LlamaContext | null = null;
    try {
      context = await this.enqueueNativeInit();

      if (!this.isInitAttemptCurrent(attemptId)) {
        await this.releaseContextQuietly(context);
        this.context = null;
        if (this.status === 'initializing') {
          this.status = 'failed';
        }
        throw new LocalLLMProviderError('Initialization cancelled (stale attempt)', 'cancelled');
      }

      this.context = context;
      this.status = 'ready';
      logger.info('llama.rn context ready', {
        contextSize: this.contextSize,
        gpuLayers: this.nGpuLayers,
        gpu: context.gpu,
        attemptId,
      });
    } catch (error) {
      if (this.isInitAttemptCurrent(attemptId)) {
        this.context = null;
        this.status = 'failed';
      }
      throw mapNativeError(error, 'init_failed');
    }
  }

  async chat(
    messages: ChatMessage[],
    options: GenerationOptions = {},
    onToken?: TokenCallback,
  ): Promise<string> {
    if (!this.context || !this.isReady()) {
      throw new LocalLLMProviderError('Local model is not ready', 'not_ready');
    }
    if (this.generating) {
      throw new LocalLLMProviderError('A generation is already in progress', 'busy');
    }

    this.generating = true;
    this.cancelRequested = false;
    this.status = 'generating';
    const context = this.context;

    try {
      const result: NativeCompletionResult = await context.completion(
        {
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          n_predict: options.maxTokens ?? LOCAL_MODEL_CONFIG.maxGenerationTokens,
          temperature: options.temperature ?? LOCAL_MODEL_CONFIG.temperature,
          top_p: options.topP ?? LOCAL_MODEL_CONFIG.topP,
          stop: options.stop ?? [...LOCAL_MODEL_STOP_SEQUENCES],
        },
        (data: TokenData) => {
          if (this.cancelRequested) return;
          const token = data.token ?? '';
          if (token) onToken?.(token);
        },
      );

      if (this.cancelRequested || result.interrupted) {
        throw new LocalLLMProviderError('Generation cancelled', 'cancelled');
      }

      return (result.content || result.text || '').trim();
    } catch (error) {
      if (error instanceof LocalLLMProviderError) throw error;
      throw mapNativeError(error, 'generation_failed');
    } finally {
      this.generating = false;
      if (this.status === 'generating') {
        this.status = this.context ? 'ready' : 'failed';
      }
    }
  }

  async cancelGeneration(): Promise<void> {
    this.cancelRequested = true;
    if (this.context) {
      try {
        await this.context.stopCompletion();
      } catch (error) {
        logger.warn('stopCompletion failed', { error: String(error) });
      }
    }
  }

  async unload(): Promise<void> {
    // Mark logical attempt stale immediately so callers can fall back.
    // Do NOT wait for / clear the underlying native init — the global gate
    // ensures a subsequent initialize() cannot start another initLlama until
    // the in-flight native Promise settles (and any stale context is released).
    this.initCanceled = true;
    this.initAttemptId += 1;
    this.cancelRequested = true;
    this.logicalInitPromise = null;
    if (this.context) {
      try {
        await this.context.release();
      } catch (error) {
        logger.warn('Failed to release llama.rn context', { error: String(error) });
      }
      this.context = null;
    }
    this.generating = false;
    this.status = 'unloaded';
  }
}
