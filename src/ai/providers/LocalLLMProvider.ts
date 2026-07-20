/**
 * Provider-agnostic contract for on-device local LLM inference.
 *
 * Oppuna must not depend on Ollama, localhost HTTP servers, or cloud APIs.
 * Concrete backends (llama.rn today; others later) implement this interface.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
}

export type TokenCallback = (token: string) => void;

export type LocalLLMProviderStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'generating'
  | 'failed'
  | 'unloaded';

export interface LocalLLMProviderInfo {
  /** Stable provider id, e.g. `llama.rn`. */
  readonly id: string;
  /** Human-readable name for diagnostics. */
  readonly displayName: string;
}

/**
 * On-device inference backend.
 *
 * Implementations must:
 * - never perform network I/O
 * - never throw from `isReady()`
 * - serialize or reject concurrent `chat()` calls unless explicitly supported
 * - free native resources in `unload()`
 */
export interface LocalLLMProvider extends LocalLLMProviderInfo {
  /** Load weights / create native context. Idempotent when already ready. */
  initialize(): Promise<void>;

  /** Whether the provider can accept `chat()` calls right now. Never throws. */
  isReady(): boolean;

  /** Current lifecycle status for diagnostics. */
  getStatus(): LocalLLMProviderStatus;

  /**
   * Generate a completion. When `onToken` is provided, tokens are streamed
   * as they are produced. Resolves with the full assistant text.
   */
  chat(
    messages: ChatMessage[],
    options?: GenerationOptions,
    onToken?: TokenCallback,
  ): Promise<string>;

  /** Abort an in-flight generation if one is running. */
  cancelGeneration(): Promise<void>;

  /** Release native resources. Safe to call multiple times. */
  unload(): Promise<void>;
}

export class LocalLLMProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_ready'
      | 'busy'
      | 'cancelled'
      | 'oom'
      | 'init_failed'
      | 'generation_failed'
      | 'unavailable',
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LocalLLMProviderError';
  }
}
