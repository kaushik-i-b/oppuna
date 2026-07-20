/**
 * Mental health agent — on-device Llama companion for chat.
 *
 * Runs entirely on the user's phone via llama.rn. Builds a guardrailed
 * mental-wellness prompt, streams a reply from the local model, and validates
 * the output before it reaches the chat UI. When no model is available or
 * generation fails validation, the orchestrator falls back to the rule engine.
 */

import { logger } from '@/utils/logger';
import type {
  AIMessage,
  Intent,
  LLMTokenCallback,
  LocalLLMClient,
  ValidationViolation,
} from '@/ai/types';
import type { MoodKey } from '@/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import { buildPrompt } from '@/ai/promptBuilder';
import {
  generateStreamWithTimeout,
  generateWithTimeout,
  getLocalLLMClient,
  isLLMAvailable,
} from '@/ai/llmClient';
import { validateResponse } from '@/ai/responseValidator';

/** Default generation timeout — keeps chat responsive on mobile hardware. */
const DEFAULT_TIMEOUT_MS = 6000;

export interface MentalHealthAgentInput {
  /** Chat session id — scopes conversation memory. */
  sessionId: string;
  /** The user's latest message (already screened by the safety engine). */
  userText: string;
  /** Session memory for intent/mood context and repetition prevention. */
  memory: ConversationMemory;
  /** Recent chat turns from local storage, oldest first. */
  recentMessages?: AIMessage[];
  /** Intent/mood hints from the rule engine. */
  intentHint?: Intent;
  moodHint?: MoodKey | null;
}

export interface MentalHealthAgentDeps {
  /** Injectable client for tests. Defaults to the registered local LLM. */
  client?: LocalLLMClient;
  /** Optional streaming callback for token-by-token UI updates. */
  onToken?: LLMTokenCallback;
  /** Hard cap on generation time. */
  timeoutMs?: number;
}

export type MentalHealthAgentOutcome =
  | { ok: true; reply: string }
  | {
      ok: false;
      reason: 'unavailable' | 'rejected' | 'error' | 'timeout';
      violations?: ValidationViolation[];
    };

/**
 * On-device mental wellness agent backed by a local Llama model.
 *
 * The agent never performs network I/O. It is the primary intelligence layer
 * for chat when a GGUF model is present on the device.
 */
export class MentalHealthAgent {
  private readonly client: LocalLLMClient;
  private readonly timeoutMs: number;

  constructor(deps: { client?: LocalLLMClient; timeoutMs?: number } = {}) {
    this.client = deps.client ?? getLocalLLMClient();
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** Whether a local Llama model is present and ready on this device. */
  async isReady(): Promise<boolean> {
    return isLLMAvailable(this.client);
  }

  /**
   * Generate a validated mental-health reply from the on-device Llama model.
   * Returns `ok: false` when the model is unavailable, times out, errors, or
   * produces a reply that fails safety validation.
   */
  async respond(
    input: MentalHealthAgentInput,
    deps: Pick<MentalHealthAgentDeps, 'onToken'> = {},
  ): Promise<MentalHealthAgentOutcome> {
    const available = await this.isReady();
    if (!available) {
      return { ok: false, reason: 'unavailable' };
    }

    const recentReplies = input.memory.recentReplies();

    try {
      const prompt = buildPrompt({
        userText: input.userText,
        memory: input.memory,
        recentMessages: input.recentMessages,
        intentHint: input.intentHint,
        moodHint: input.moodHint,
      });

      const completion = deps.onToken
        ? await generateStreamWithTimeout(this.client, prompt, this.timeoutMs, deps.onToken)
        : await generateWithTimeout(this.client, prompt, this.timeoutMs);

      const candidate = completion.text.trim();
      const verdict = validateResponse(candidate, { recentReplies });

      if (completion.finishReason === 'stop' && verdict.ok) {
        return { ok: true, reply: candidate };
      }

      logger.warn('Mental health agent reply rejected', {
        violations: verdict.violations,
        finishReason: completion.finishReason,
      });
      return { ok: false, reason: 'rejected', violations: verdict.violations };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const reason = message.includes('timed out') ? 'timeout' : 'error';
      logger.warn('Mental health agent generation failed', { error: message, reason });
      return { ok: false, reason };
    }
  }
}

let defaultAgent: MentalHealthAgent | null = null;

/** Shared on-device mental health agent instance. */
export function getMentalHealthAgent(): MentalHealthAgent {
  if (!defaultAgent) {
    defaultAgent = new MentalHealthAgent();
  }
  return defaultAgent;
}

/** @internal Reset singleton for unit tests. */
export function __resetMentalHealthAgentForTests(): void {
  defaultAgent = null;
}
