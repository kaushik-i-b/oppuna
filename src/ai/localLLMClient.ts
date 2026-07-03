/**
 * llama.rn-backed local LLM client.
 *
 * Implements the `LocalLLMClient` contract using GGUF inference via llama.rn.
 * Fully offline — no network calls.
 */

import { Platform } from 'react-native';
import { initLlama, type LlamaContext, type NativeCompletionResult, type TokenData } from 'llama.rn';

import { LLM_CONFIG } from '@/constants/app';
import { logger } from '@/utils/logger';
import type {
  LLMCompletion,
  LLMFinishReason,
  LLMGenerateOptions,
  LLMPrompt,
  LLMTokenCallback,
  LocalLLMClient,
} from '@/ai/types';
import {
  getModelPath,
  getModelState,
  initializeModelManager,
  isModelReady,
  markModelError,
  markModelLoading,
  markModelReady,
  markModelReleased,
} from '@/ai/modelManager';
import { LLMGenerationError, LLMUnavailableError } from '@/ai/llmClient';

const DEFAULT_STOP_SEQUENCES = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|im_end|>',
  '<|EOT|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
  '<|endoftext|>',
] as const;

function mapFinishReason(result: NativeCompletionResult, aborted: boolean): LLMFinishReason {
  if (aborted || result.interrupted) return 'aborted';
  if (result.stopped_limit || result.truncated || result.context_full) return 'length';
  return 'stop';
}

function toFileUri(path: string): string {
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
}

/**
 * On-device LLM client backed by llama.rn / llama.cpp.
 */
export class LlamaRnLocalLLMClient implements LocalLLMClient {
  readonly id: string;
  private context: LlamaContext | null = null;
  private loadPromise: Promise<LlamaContext | null> | null = null;

  constructor() {
    const modelId = getModelState().modelId;
    this.id = modelId ? `llama.rn:${modelId}` : 'llama.rn';
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (isModelReady() && this.context !== null) return true;

    await initializeModelManager();
    const modelState = getModelState();
    if (modelState.status === 'unavailable' || modelState.status === 'error') {
      return false;
    }
    return getModelPath() !== null;
  }

  async warmUp(): Promise<void> {
    if (Platform.OS === 'web') return;
    await this.ensureContext();
  }

  async generate(prompt: LLMPrompt, options?: LLMGenerateOptions): Promise<LLMCompletion> {
    return this.runCompletion(prompt, options);
  }

  async generateStream(
    prompt: LLMPrompt,
    onToken: LLMTokenCallback,
    options?: LLMGenerateOptions,
  ): Promise<LLMCompletion> {
    return this.runCompletion(prompt, options, onToken);
  }

  async release(): Promise<void> {
    this.loadPromise = null;
    if (this.context) {
      try {
        await this.context.release();
      } catch (error) {
        logger.warn('Failed to release llama.rn context', { error: String(error) });
      }
      this.context = null;
    }
    markModelReleased();
  }

  private async ensureContext(): Promise<LlamaContext | null> {
    if (this.context) return this.context;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.loadContext();
    try {
      return await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async loadContext(): Promise<LlamaContext | null> {
    await initializeModelManager();
    const modelPath = getModelPath();
    if (!modelPath) {
      return null;
    }

    markModelLoading();

    try {
      const context = await initLlama({
        model: toFileUri(modelPath),
        use_mlock: true,
        n_ctx: LLM_CONFIG.contextSize,
        n_threads: LLM_CONFIG.maxThreads,
        n_gpu_layers: Platform.OS === 'ios' ? LLM_CONFIG.gpuLayers : 0,
      });

      this.context = context;
      markModelReady();
      logger.info('llama.rn model loaded', {
        modelId: getModelState().modelId,
        gpu: context.gpu,
      });
      return context;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      markModelError(message);
      logger.error('Failed to load llama.rn model', { error: message });
      throw new LLMGenerationError(`Failed to load on-device model: ${message}`, error);
    }
  }

  private promptToMessages(prompt: LLMPrompt): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: prompt.system },
    ];

    for (const turn of prompt.turns) {
      if (turn.role === 'system') {
        messages.push({ role: 'system', content: turn.content });
      } else {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    return messages;
  }

  private async runCompletion(
    prompt: LLMPrompt,
    options?: LLMGenerateOptions,
    onToken?: LLMTokenCallback,
  ): Promise<LLMCompletion> {
    const started = Date.now();
    const context = await this.ensureContext();
    if (!context) {
      throw new LLMUnavailableError();
    }

    const params = prompt.params ?? {};
    let aborted = false;

    const onAbort = (): void => {
      aborted = true;
      void context.stopCompletion().catch(() => undefined);
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        return { text: '', finishReason: 'aborted', durationMs: 0 };
      }
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      const result = await context.completion(
        {
          messages: this.promptToMessages(prompt),
          n_predict: params.maxTokens ?? 220,
          temperature: params.temperature ?? 0.7,
          top_p: params.topP ?? 0.9,
          stop: params.stopSequences ?? [...DEFAULT_STOP_SEQUENCES],
        },
        (data: TokenData) => {
          if (aborted) return;
          const token = data.token ?? '';
          if (token) onToken?.(token);
        },
      );

      const text = (result.content || result.text || '').trim();
      return {
        text,
        finishReason: mapFinishReason(result, aborted),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      if (aborted) {
        return { text: '', finishReason: 'aborted', durationMs: Date.now() - started };
      }
      throw new LLMGenerationError('llama.rn generation failed', error);
    } finally {
      options?.signal?.removeEventListener('abort', onAbort);
    }
  }
}
