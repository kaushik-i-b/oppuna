/**
 * Deterministic fake provider for unit/integration tests.
 * Never touches native code or the filesystem.
 */

import type {
  ChatMessage,
  GenerationOptions,
  LocalLLMProvider,
  LocalLLMProviderStatus,
  TokenCallback,
} from '@/ai/providers/LocalLLMProvider';
import { LocalLLMProviderError } from '@/ai/providers/LocalLLMProvider';

export interface FakeLocalLLMProviderOptions {
  /** Whether initialize() succeeds. Defaults to true. */
  initializeOk?: boolean;
  /** Fixed reply, or a function of the chat messages. */
  reply?: string | ((messages: ChatMessage[]) => string);
  /** Simulated initialize latency. */
  initLatencyMs?: number;
  /** Simulated generation latency. */
  latencyMs?: number;
  /** When true, chat() throws after optional latency. */
  failGeneration?: boolean;
  /** Stream token granularity. Defaults to word-ish chunks. */
  streamByWord?: boolean;
}

const DEFAULT_REPLY =
  'Thank you for telling me. That sounds like a lot to carry, and it makes sense it weighs on you. ' +
  'What feels most present for you right now?';

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export class FakeLocalLLMProvider implements LocalLLMProvider {
  readonly id = 'fake';
  readonly displayName = 'Fake Local LLM';

  private status: LocalLLMProviderStatus = 'uninitialized';
  private cancelled = false;
  private generating = false;
  private readonly options: FakeLocalLLMProviderOptions;

  constructor(options: FakeLocalLLMProviderOptions = {}) {
    this.options = options;
  }

  getStatus(): LocalLLMProviderStatus {
    return this.status;
  }

  isReady(): boolean {
    return this.status === 'ready' || this.status === 'generating';
  }

  async initialize(): Promise<void> {
    if (this.status === 'ready') return;
    this.status = 'initializing';
    await delay(this.options.initLatencyMs ?? 0);
    if (this.options.initializeOk === false) {
      this.status = 'failed';
      throw new LocalLLMProviderError('Fake provider initialization failed', 'init_failed');
    }
    this.status = 'ready';
  }

  private resolveReply(messages: ChatMessage[]): string {
    const { reply } = this.options;
    if (typeof reply === 'function') return reply(messages);
    return reply ?? DEFAULT_REPLY;
  }

  async chat(
    messages: ChatMessage[],
    _options?: GenerationOptions,
    onToken?: TokenCallback,
  ): Promise<string> {
    if (!this.isReady()) {
      throw new LocalLLMProviderError('Fake provider is not ready', 'not_ready');
    }
    if (this.generating) {
      throw new LocalLLMProviderError('Generation already in progress', 'busy');
    }

    this.generating = true;
    this.cancelled = false;
    this.status = 'generating';

    try {
      await delay(this.options.latencyMs ?? 0);
      if (this.cancelled) {
        throw new LocalLLMProviderError('Generation cancelled', 'cancelled');
      }
      if (this.options.failGeneration) {
        throw new LocalLLMProviderError('Fake generation failure', 'generation_failed');
      }

      const text = this.resolveReply(messages);
      if (onToken) {
        const chunks =
          this.options.streamByWord === false
            ? [text]
            : text.split(/(?<=\s)/).filter((part) => part.length > 0);
        for (const chunk of chunks) {
          if (this.cancelled) {
            throw new LocalLLMProviderError('Generation cancelled', 'cancelled');
          }
          onToken(chunk);
        }
      }
      return text;
    } finally {
      this.generating = false;
      if (this.status === 'generating') {
        this.status = 'ready';
      }
    }
  }

  async cancelGeneration(): Promise<void> {
    this.cancelled = true;
  }

  async unload(): Promise<void> {
    this.cancelled = true;
    this.generating = false;
    this.status = 'unloaded';
  }

  /** Force a failed status without going through initialize(). */
  markFailed(): void {
    this.status = 'failed';
  }
}
