/**
 * Compatibility layer — the offline AI engine moved to `src/ai/`.
 *
 * The rule-based engine now lives in `@/ai/fallbackEngine`, crisis detection
 * in `@/ai/safetyEngine`, and the orchestrated chat entry point is
 * `generateAIResponse` in `@/ai`. This module re-exports the original public
 * API so existing imports keep working unchanged.
 */

export type { Rng, Intent, GenerateOptions } from '@/ai';
export type { EngineResponse as AIResponse } from '@/ai/types';
export { CRISIS_PATTERNS, detectCrisis } from '@/ai/safetyEngine';
export {
  buildReply,
  detectIntent,
  detectMood,
  generateResponse,
  randomPrompt,
  SAFE_FALLBACK,
  JOURNALING_PROMPTS,
  BREATHING_SUGGESTIONS,
  GROUNDING_SUGGESTIONS,
  SLEEP_SUGGESTIONS,
  CBT_TEMPLATES,
  MINDFULNESS_TEMPLATES,
} from '@/ai/fallbackEngine';
