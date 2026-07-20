/**
 * Prompt builder — turns conversation state into a guardrailed prompt for a
 * future on-device LLM. Pure and deterministic; no network, no side effects.
 *
 * Delegates to the mental health agent by default. Prefer using agents directly
 * via the orchestrator (`generateAIResponse`).
 */

import type { MoodKey } from '@/types';
import type { AIMessage, Intent, LLMPrompt } from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import { buildMentalHealthSystemPrompt, mentalHealthAgent } from '@/ai/agents/mentalHealthAgent';

export { buildMentalHealthSystemPrompt };

/**
 * System instructions for any local model. The response validator remains the
 * enforcement layer — these instructions just steer generation toward replies
 * that will pass it.
 */
export function buildSystemPrompt(): string {
  return buildMentalHealthSystemPrompt();
}

export interface PromptInput {
  /** The new user message (already screened by the safety engine). */
  userText: string;
  /** Session memory used to summarise recent context. */
  memory?: ConversationMemory;
  /** Recent chat turns, oldest first. Optional — memory alone also works. */
  recentMessages?: AIMessage[];
  /** Intent/mood detected by the rule engine, passed as hints to the model. */
  intentHint?: Intent;
  moodHint?: MoodKey | null;
}

/** Build the full prompt for one generation call. */
export function buildPrompt(input: PromptInput): LLMPrompt {
  return mentalHealthAgent.buildPrompt(input);
}
