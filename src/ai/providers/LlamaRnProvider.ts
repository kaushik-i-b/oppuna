/**
 * llama.rn / llama.cpp provider — inference only.
 *
 * Model discovery, integrity, and lifecycle orchestration live in modelManager.
 * This class must not call cloud APIs, Ollama, or perform network I/O.
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
  private initPromise: Promise<void> | null = null;
  private generating = false;
  private cancelRequested = false;

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

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      this.status = 'failed';
      throw new LocalLLMProviderError('llama.rn is not available on web', 'unavailable');
    }

    if (this.context && this.status === 'ready') {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.status = 'initializing';
    this.initPromise = this.loadContext();
    try {
      await this.initPromise;
    } finally {
      // Clear so a later retry after failure actually retries.
      this.initPromise = null;
    }
  }

  private async loadContext(): Promise<void> {
    try {
      const context = await initLlama({
        model: toFileUri(this.modelPath),
        use_mmap: true,
        use_mlock: this.useMlock,
        n_ctx: this.contextSize,
        n_threads: this.nThreads,
        n_gpu_layers: this.nGpuLayers,
      });
      this.context = context;
      this.status = 'ready';
      logger.info('llama.rn context ready', {
        contextSize: this.contextSize,
        gpuLayers: this.nGpuLayers,
        gpu: context.gpu,
      });
    } catch (error) {
      this.context = null;
      this.status = 'failed';
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
    this.cancelRequested = true;
    this.initPromise = null;
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
