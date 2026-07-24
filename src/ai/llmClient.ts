/**
 * Local LLM client — interface, registry, mock, and llama.rn integration.
 *
 * On native platforms the default client is `LlamaRnLocalLLMClient`, which
 * loads a GGUF model from local app storage. When no model is present it
 * reports unavailable and the orchestrator falls back to the rule engine.
 *
 * Nothing in this file may perform network I/O.
 */

import { Platform } from 'react-native';

import { logger } from '@/utils/logger';
import { cancelGeneration } from '@/ai/modelManager';
import { LlamaRnLocalLLMClient } from '@/ai/localLLMClient';
import type {
  LLMCompletion,
  LLMGenerateOptions,
  LLMPrompt,
  LLMTokenCallback,
  LocalLLMClient,
} from '@/ai/types';

export class LLMUnavailableError extends Error {
  constructor(message = 'No local LLM is available on this device.') {
    super(message);
    this.name = 'LLMUnavailableError';
  }
}

export class LLMGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'LLMGenerationError';
  }
}

/* ------------------------------------------------------------------ *
 * Mock implementation
 * ------------------------------------------------------------------ */

export interface MockLocalLLMClientOptions {
  /** Whether the mock reports itself as available. Defaults to false. */
  available?: boolean;
  /** Fixed reply text, or a function of the prompt. */
  reply?: string | ((prompt: LLMPrompt) => string);
  /** Simulated per-call latency in ms. Defaults to 0. */
  latencyMs?: number;
  /** When true, `generate` rejects — for testing error handling. */
  failGeneration?: boolean;
}

const DEFAULT_MOCK_REPLY =
  'Thank you for telling me. That sounds like a lot to carry, and it makes sense it weighs on you. ' +
  'What feels most present for you right now? If it helps, we could take one slow breath together.';

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

/**
 * Deterministic in-memory stand-in for a real on-device model. Used in tests
 * and available for local development of the LLM code path.
 */
export class MockLocalLLMClient implements LocalLLMClient {
  readonly id = 'mock';
  private readonly options: MockLocalLLMClientOptions;

  constructor(options: MockLocalLLMClientOptions = {}) {
    this.options = options;
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(this.options.available ?? false);
  }

  private resolveReply(prompt: LLMPrompt): string {
    const { reply } = this.options;
    if (typeof reply === 'function') return reply(prompt);
    return reply ?? DEFAULT_MOCK_REPLY;
  }

  async generate(prompt: LLMPrompt, options?: LLMGenerateOptions): Promise<LLMCompletion> {
    const started = Date.now();
    if (!(await this.isAvailable())) throw new LLMUnavailableError();
    if (this.options.failGeneration) {
      throw new LLMGenerationError('Mock generation failure');
    }
    await delay(this.options.latencyMs ?? 0);
    if (options?.signal?.aborted) {
      return { text: '', finishReason: 'aborted', durationMs: Date.now() - started };
    }
    return {
      text: this.resolveReply(prompt),
      finishReason: 'stop',
      durationMs: Date.now() - started,
    };
  }

  async generateStream(
    prompt: LLMPrompt,
    onToken: LLMTokenCallback,
    options?: LLMGenerateOptions,
  ): Promise<LLMCompletion> {
    const completion = await this.generate(prompt, options);
    if (completion.finishReason === 'stop') {
      // Emit word-level tokens so streaming consumers can be exercised.
      for (const token of completion.text.split(/(?<=\s)/)) {
        onToken(token);
      }
    }
    return completion;
  }
}

/* ------------------------------------------------------------------ *
 * Registry + availability check
 * ------------------------------------------------------------------ */

let activeClient: LocalLLMClient = new MockLocalLLMClient({ available: false });

/** Register the platform default client (llama.rn on native, mock elsewhere). */
export function configureDefaultLocalLLMClient(): void {
  if (Platform.OS === 'web') {
    setLocalLLMClient(new MockLocalLLMClient({ available: false }));
    return;
  }
  setLocalLLMClient(new LlamaRnLocalLLMClient());
}

/** Register a client (a future native model, or a configured mock in tests). */
export function setLocalLLMClient(client: LocalLLMClient): void {
  activeClient = client;
  logger.info('Local LLM client registered', { id: client.id });
}

export function getLocalLLMClient(): LocalLLMClient {
  return activeClient;
}

/** Safe availability check — never throws. */
export async function isLLMAvailable(client: LocalLLMClient = activeClient): Promise<boolean> {
  try {
    return await client.isAvailable();
  } catch (error) {
    logger.warn('LLM availability check failed', { error: String(error) });
    return false;
  }
}

/** Run a generation with a hard timeout; cancels native inference on expiry. */
export async function generateWithTimeout(
  client: LocalLLMClient,
  prompt: LLMPrompt,
  timeoutMs: number,
): Promise<LLMCompletion> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      void cancelGeneration().catch(() => undefined);
      controller.abort();
      reject(new LLMGenerationError(`LLM timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      client.generate(prompt, { timeoutMs, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Streaming generation with a hard timeout and native cancellation. */
export async function generateStreamWithTimeout(
  client: LocalLLMClient,
  prompt: LLMPrompt,
  timeoutMs: number,
  onToken: LLMTokenCallback,
): Promise<LLMCompletion> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generationId = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      generationId += 1;
      void cancelGeneration().catch(() => undefined);
      controller.abort();
      reject(new LLMGenerationError(`LLM timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const guardedOnToken: LLMTokenCallback = (token) => {
    if (controller.signal.aborted) return;
    onToken(token);
  };

  try {
    return await Promise.race([
      client.generateStream(prompt, guardedOnToken, { timeoutMs, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    void generationId;
  }
}
