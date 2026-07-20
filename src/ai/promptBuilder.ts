/**
 * Prompt builder — turns conversation state into a guardrailed prompt for the
 * on-device LLM. Pure and deterministic; no network, no side effects.
 *
 * The persona and guardrails come from the mental health agent profile
 * (`mentalHealthAgent.ts`); this module assembles them with session context
 * and recent chat history into a single `LLMPrompt`.
 */

import type { MoodKey } from '@/types';
import type { AIMessage, Intent, LLMPrompt } from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import { getActiveAgent } from '@/ai/mentalHealthAgent';

/** How many recent conversation turns are included in the prompt. */
const MAX_CONTEXT_TURNS = 8;

/**
 * System instructions for the local model, sourced from the active agent
 * persona. The response validator remains the enforcement layer — these
 * instructions just steer generation toward replies that will pass it.
 */
export function buildSystemPrompt(): string {
  return getActiveAgent().systemPrompt;
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

function contextSummary(input: PromptInput): string | null {
  const parts: string[] = [];

  const intents = input.memory?.recentIntents(4) ?? [];
  if (intents.length > 0) {
    parts.push(`Recent topics: ${[...new Set(intents)].join(', ')}.`);
  }
  const moods = input.memory?.recentMoods(4) ?? [];
  if (moods.length > 0) {
    parts.push(`Recent moods: ${[...new Set(moods)].join(', ')}.`);
  }
  if (input.intentHint && input.intentHint !== 'unknown') {
    parts.push(`Current topic looks like: ${input.intentHint}.`);
  }
  if (input.moodHint) {
    parts.push(`Current mood looks like: ${input.moodHint}.`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/** Build the full prompt for one generation call. */
export function buildPrompt(input: PromptInput): LLMPrompt {
  const turns: AIMessage[] = [];

  const summary = contextSummary(input);
  if (summary) {
    turns.push({ role: 'system', content: `Context (on-device, private): ${summary}` });
  }

  const history = (input.recentMessages ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_CONTEXT_TURNS);
  turns.push(...history);

  turns.push({ role: 'user', content: input.userText.trim() });

  return {
    system: buildSystemPrompt(),
    turns,
    params: { ...getActiveAgent().params },
  };
}
