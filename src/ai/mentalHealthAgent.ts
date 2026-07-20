/**
 * Mental health agent backed by the on-device Llama client.
 *
 * This module owns the model-backed response path: it builds the guarded prompt,
 * calls llama.rn through the LocalLLMClient contract, and validates the reply
 * before chat is allowed to show it. It never performs network I/O.
 */

import { LLM_CONFIG } from '@/constants/app';
import type { MoodKey } from '@/types';
import type {
  AIMessage,
  Intent,
  LLMCompletion,
  LLMFinishReason,
  LLMTokenCallback,
  LocalLLMClient,
  ValidationViolation,
} from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import { buildPrompt } from '@/ai/promptBuilder';
import { generateStreamWithTimeout, generateWithTimeout, getLocalLLMClient, isLLMAvailable } from '@/ai/llmClient';
import { validateResponse } from '@/ai/responseValidator';

export const MENTAL_HEALTH_AGENT_ID = 'oppuna-llama-mental-health-agent';

export interface MentalHealthAgentInput {
  userText: string;
  memory?: ConversationMemory;
  recentMessages?: AIMessage[];
  intentHint?: Intent;
  moodHint?: MoodKey | null;
  recentReplies?: readonly string[];
  onToken?: LLMTokenCallback;
}

export interface MentalHealthAgentResponse {
  agentId: typeof MENTAL_HEALTH_AGENT_ID;
  clientId: string;
  reply: string;
  completion: LLMCompletion;
}

export class MentalHealthAgentRejectedError extends Error {
  constructor(
    readonly violations: ValidationViolation[],
    readonly finishReason: LLMFinishReason,
  ) {
    super('Mental health agent reply did not pass validation.');
    this.name = 'MentalHealthAgentRejectedError';
  }
}

export class MentalHealthLlamaAgent {
  readonly id = MENTAL_HEALTH_AGENT_ID;

  constructor(
    private readonly client: LocalLLMClient = getLocalLLMClient(),
    private readonly timeoutMs: number = LLM_CONFIG.responseTimeoutMs,
  ) {}

  async isAvailable(): Promise<boolean> {
    return isLLMAvailable(this.client);
  }

  async respond(input: MentalHealthAgentInput): Promise<MentalHealthAgentResponse> {
    const prompt = buildPrompt({
      userText: input.userText,
      memory: input.memory,
      recentMessages: input.recentMessages,
      intentHint: input.intentHint,
      moodHint: input.moodHint,
    });

    const completion = input.onToken
      ? await generateStreamWithTimeout(this.client, prompt, this.timeoutMs, input.onToken)
      : await generateWithTimeout(this.client, prompt, this.timeoutMs);
    const candidate = completion.text.trim();
    const verdict = validateResponse(candidate, { recentReplies: input.recentReplies });

    if (completion.finishReason !== 'stop' || !verdict.ok) {
      throw new MentalHealthAgentRejectedError(verdict.violations, completion.finishReason);
    }

    return {
      agentId: this.id,
      clientId: this.client.id,
      reply: candidate,
      completion,
    };
  }
}
