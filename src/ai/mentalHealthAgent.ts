import { buildPrompt, type PromptInput } from '@/ai/promptBuilder';
import type { LLMPrompt } from '@/ai/types';

export const MENTAL_HEALTH_AGENT_NAME = 'Oppuna Companion';

/**
 * Builds the prompt for the on-device Llama mental health agent that runs
 * fully inside the mobile app.
 */
export function buildMentalHealthPrompt(input: PromptInput): LLMPrompt {
  const prompt = buildPrompt(input);

  return {
    ...prompt,
    system: [
      `You are ${MENTAL_HEALTH_AGENT_NAME}, the private mental wellness agent inside the Oppuna mobile app.`,
      'You run fully on-device using a local Llama model when one is available.',
      'Reply as part of an ongoing private mobile chat, so use the recent conversation turns to stay consistent and supportive.',
      'Keep the tone grounded, warm, and emotionally validating without sounding clinical.',
      prompt.system,
    ].join('\n'),
  };
}
