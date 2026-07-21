/**
 * llama.rn-backed LocalLLMClient adapter.
 *
 * Delegates lifecycle to modelManager / LlamaRnProvider so the rest of the
 * app can keep using the existing LocalLLMClient contract.
 */

import { Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { logger } from '@/utils/logger';
import type {
  LLMCompletion,
  LLMGenerateOptions,
  LLMPrompt,
  LLMTokenCallback,
  LocalLLMClient,
} from '@/ai/types';
import type { ChatMessage } from '@/ai/providers';
import {
  cancelGeneration,
  generate,
  getModelState,
  initializeModel,
  isModelReady,
  unloadModel,
} from '@/ai/modelManager';
import { LLMGenerationError, LLMUnavailableError } from '@/ai/llmClient';

function promptToMessages(prompt: LLMPrompt): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: prompt.system }];
  for (const turn of prompt.turns) {
    if (turn.role === 'system' || turn.role === 'user' || turn.role === 'assistant') {
      messages.push({ role: turn.role, content: turn.content });
    }
  }
  return messages;
}

/**
 * On-device LLM client backed by the LocalLLMProvider managed in modelManager.
 */
export class LlamaRnLocalLLMClient implements LocalLLMClient {
  readonly id: string;

  constructor() {
    const modelId = getModelState().modelId;
    this.id = modelId ? `llama.rn:${modelId}` : 'llama.rn';
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (isModelReady()) return true;

    const state = await initializeModel();
    return state.status === 'ready' || state.status === 'generating';
  }

  async warmUp(): Promise<void> {
    if (Platform.OS === 'web') return;
    const state = await initializeModel();
    if (state.status === 'failed' || state.status === 'unavailable') {
      logger.warn('On-device model warm-up skipped', {
        status: state.status,
        error: state.error,
      });
    }
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
    await unloadModel();
  }

  private async runCompletion(
    prompt: LLMPrompt,
    options?: LLMGenerateOptions,
    onToken?: LLMTokenCallback,
  ): Promise<LLMCompletion> {
    const started = Date.now();

    if (!isModelReady()) {
      const state = await initializeModel();
      if (state.status !== 'ready') {
        throw new LLMUnavailableError(state.error ?? undefined);
      }
    }

    if (options?.signal?.aborted) {
      return { text: '', finishReason: 'aborted', durationMs: 0 };
    }

    const onAbort = (): void => {
      void cancelGeneration().catch(() => undefined);
    };
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const params = prompt.params ?? {};
      const messages =
        prompt.messages && prompt.messages.length > 0
          ? prompt.messages
          : promptToMessages(prompt);
      const text = await generate(
        messages,
        {
          maxTokens: params.maxTokens ?? LOCAL_MODEL_CONFIG.maxGenerationTokens,
          temperature: params.temperature ?? LOCAL_MODEL_CONFIG.temperature,
          topP: params.topP ?? LOCAL_MODEL_CONFIG.topP,
          stop: params.stopSequences,
        },
        onToken,
      );

      if (options?.signal?.aborted) {
        return { text: '', finishReason: 'aborted', durationMs: Date.now() - started };
      }

      return {
        text,
        finishReason: 'stop',
        durationMs: Date.now() - started,
      };
    } catch (error) {
      if (options?.signal?.aborted) {
        return { text: '', finishReason: 'aborted', durationMs: Date.now() - started };
      }
      const message = error instanceof Error ? error.message : String(error);
      if (/not ready|unavailable/i.test(message)) {
        throw new LLMUnavailableError(message);
      }
      throw new LLMGenerationError('llama.rn generation failed', error);
    } finally {
      options?.signal?.removeEventListener('abort', onAbort);
    }
  }
}
