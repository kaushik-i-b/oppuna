/**
 * Mental health companion agent — Oppuna's default chat persona.
 *
 * Uses a Gemma-optimised system prompt for on-device inference via llama.rn.
 * When no model is available the orchestrator falls back to the rule engine
 * with the same intent routing and safety pipeline.
 */

import type { Intent } from '@/ai/types';
import type { AgentPromptInput, ChatAgent } from '@/ai/agents/types';
import { suggestionsFor } from '@/ai/fallbackEngine';

const MAX_CONTEXT_TURNS = 8;

const DEFAULT_PARAMS = {
  maxTokens: 220,
  temperature: 0.65,
  topP: 0.9,
} as const;

function contextSummary(input: AgentPromptInput): string | null {
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

/**
 * System prompt tuned for small on-device Gemma instruct models.
 * Keeps instructions concrete and short so quantized models follow them reliably.
 */
export function buildMentalHealthSystemPrompt(): string {
  return [
    'You are Oppuna, a warm mental wellness companion powered by a local Gemma model running entirely on the user’s mobile device.',
    'Your role: listen, validate feelings, and offer gentle coping ideas — not clinical care.',
    'You are NOT a therapist, doctor, or crisis service. Say so clearly if asked.',
    '',
    'Rules (never break these):',
    '- Do not diagnose any mental or physical condition.',
    '- Do not recommend starting, stopping, or changing medication.',
    '- Do not claim to provide therapy, treatment, or professional care.',
    '- Do not encourage self-harm, harm to others, or unsafe behaviour.',
    '- Do not suggest going online, calling APIs, or using external AI services.',
    '- Do not imply messages leave the phone; all reasoning happens privately on-device.',
    '',
    'How to respond:',
    '- Acknowledge what they shared in your own words before offering anything else.',
    '- Keep replies to 1–3 short sentences. Plain language, no jargon.',
    '- Ask at most one gentle question when it helps them reflect.',
    '- Offer one small, safe action (a breath, a pause, naming a feeling) only when it fits.',
    '- Vary your wording — sound like a caring friend, not a script.',
    '- If they seem in crisis, urge them to contact local emergency services or someone they trust.',
  ].join('\n');
}

export const mentalHealthAgent: ChatAgent = {
  id: 'mental-health',
  name: 'Mental Health Companion',
  description:
    'A private, on-device wellness companion powered by Gemma. Listens, validates, and offers gentle coping support.',

  buildSystemPrompt: buildMentalHealthSystemPrompt,

  buildPrompt(input: AgentPromptInput) {
    const turns = [];

    const summary = contextSummary(input);
    if (summary) {
      turns.push({ role: 'system' as const, content: `Context (on-device, private): ${summary}` });
    }

    const history = (input.recentMessages ?? [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_CONTEXT_TURNS);
    turns.push(...history);

    turns.push({ role: 'user' as const, content: input.userText.trim() });

    return {
      system: buildMentalHealthSystemPrompt(),
      turns,
      params: { ...DEFAULT_PARAMS },
    };
  },

  suggestionsFor(intent: Intent): string[] {
    return suggestionsFor(intent);
  },
};
