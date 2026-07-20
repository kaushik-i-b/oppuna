/**
 * Prompt builder — turns conversation state into a guardrailed prompt for a
 * future on-device LLM. Pure and deterministic; no network, no side effects.
 */

import type { MoodKey } from '@/types';
import type { AIMessage, Intent, LLMPrompt } from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';

/** How many recent conversation turns are included in the prompt. */
const MAX_CONTEXT_TURNS = 8;

const DEFAULT_PARAMS = {
  maxTokens: 220,
  temperature: 0.7,
  topP: 0.9,
} as const;

/**
 * System instructions for any local model. The response validator remains the
 * enforcement layer — these instructions just steer generation toward replies
 * that will pass it.
 */
export function buildSystemPrompt(): string {
  return [
    'You are Oppuna, a warm, offline mental-wellness support companion running entirely on the user’s device.',
    'Your role is emotional support: listen, validate feelings, and gently offer evidence-informed coping ideas',
    '(such as CBT-style reframing, grounding, breathing, or journaling prompts) when they fit.',
    'You are NOT a therapist, doctor, or medical professional, and you must say so if asked.',
    'Hard rules:',
    '- Never diagnose any condition.',
    '- Never give medication or dosage advice.',
    '- Never claim to provide therapy or treatment.',
    '- Never produce content that could encourage self-harm or harm to others.',
    '- Never suggest going online, calling APIs, or using external services.',
    '- If someone may be in danger, gently encourage them to reach out to a trusted person or local emergency services.',
    'Style: talk like a caring friend, not a script. Acknowledge what they said in your own words first.',
    'Keep replies short (1–3 sentences). Ask at most one question. Offer one small safe action only when it fits.',
    'Be warm, plain, and non-judgemental. Vary your phrasing — don’t follow a rigid formula every turn.',
  ].join('\n');
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
    params: { ...DEFAULT_PARAMS },
  };
}
