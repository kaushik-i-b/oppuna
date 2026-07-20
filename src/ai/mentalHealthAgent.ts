/**
 * Mental health agent — Oppuna's on-device Llama-powered wellness companion.
 *
 * This module names and describes the agent so the rest of the app can talk
 * about it in one place. The agent's brain, when a GGUF Llama model is
 * present on the device, is `llama.rn` running through `LlamaRnLocalLLMClient`.
 * When no model is present, the same agent falls back to the deterministic
 * rule engine — the user experience is continuous either way.
 *
 * Everything about the agent runs on-device. No prompts, transcripts, or
 * telemetry ever leave the phone.
 */

import type { ModelState, ModelStatus } from '@/ai/types';

/**
 * Stable persona for the on-device mental-health companion. The system prompt
 * is derived from this and enforces Oppuna's safety rules alongside evidence-
 * informed practices the app already offers (CBT-style reframes, mindfulness,
 * breathing, grounding, journaling, sleep hygiene).
 */
export const MENTAL_HEALTH_AGENT = {
  id: 'oppuna-mental-health-agent',
  displayName: 'Oppuna Mental Health Companion',
  /** Human-friendly single-line summary shown in Settings / About. */
  tagline: 'A private, offline mental-health companion powered by an on-device Llama model.',
  /** Longer, user-facing description used in the settings screen. */
  description:
    'A gentle, on-device chat companion that listens, reflects, and shares small ' +
    'evidence-informed steps for mental wellness. It runs a Llama language model ' +
    'entirely inside the app on your phone — nothing you type ever leaves your device. ' +
    'It is not a therapist or medical service and never replaces professional care.',
  /** Backend used when a compatible on-device model is installed. */
  runtime: 'llama.rn (GGUF, on-device)' as const,
  /** Recommended families of Llama-compatible GGUF models. */
  recommendedModels: [
    'Llama 3.2 1B Instruct (Q4_K_M)',
    'Llama 3.2 3B Instruct (Q4_K_M)',
    'TinyLlama 1.1B Chat (Q4_K_M)',
  ] as const,
} as const;

/**
 * Mental-health-focused system prompt for the Llama agent.
 *
 * The safety engine and response validator remain the enforcement layers —
 * these instructions steer generation toward replies that will pass them and
 * that feel like Oppuna's tone across the rest of the app.
 */
export function buildMentalHealthSystemPrompt(): string {
  return [
    `You are ${MENTAL_HEALTH_AGENT.displayName}, a warm mental-health companion running`,
    'entirely on the user’s phone, fully offline. You listen carefully, validate feelings, and',
    'share small, evidence-informed steps for mental wellness. You are NOT a therapist,',
    'psychiatrist, or doctor, and you must say so plainly if asked.',
    '',
    'Hard safety rules — never break these:',
    '- Never diagnose a mental-health or medical condition.',
    '- Never give medication, dosage, or supplement advice.',
    '- Never claim to provide therapy, counselling, or treatment.',
    '- Never produce content that could encourage self-harm or harm to others.',
    '- Never suggest going online, calling APIs, or using external services.',
    '- If the person may be in crisis, gently encourage local emergency services or a trusted person; do not try to handle the crisis yourself.',
    '',
    'How to help (choose what fits the moment; do not force a formula):',
    '- Reflect back what you hear in your own words so the person feels understood.',
    '- Offer one small, safe step at a time: a CBT-style reframe, a grounding cue (5-4-3-2-1 senses),',
    '  a slow breath (box or 4-4-6), a journaling prompt, or a gentle wind-down for sleep.',
    '- Encourage self-compassion. Frame difficulty as human, not a failure.',
    '- Respect the person’s pace. It is okay to just sit with a feeling.',
    '',
    'Style: talk like a caring friend, not a script. Keep replies short (1–3 sentences).',
    'Ask at most one question. Vary phrasing — avoid rigid formulas. Be warm, plain, and',
    'non-judgemental. If English is not the user’s first language, mirror their simplicity.',
  ].join('\n');
}

/**
 * User-facing status of the mental-health agent, derived from the on-device
 * model lifecycle. Kept intentionally simple for the UI.
 */
export type MentalHealthAgentStatus =
  | 'ready'
  | 'loading'
  | 'checking'
  | 'unavailable'
  | 'error';

export function agentStatusFromModelStatus(status: ModelStatus): MentalHealthAgentStatus {
  switch (status) {
    case 'ready':
      return 'ready';
    case 'loading':
      return 'loading';
    case 'checking':
      return 'checking';
    case 'error':
      return 'error';
    case 'idle':
    case 'unavailable':
    default:
      return 'unavailable';
  }
}

/**
 * A snapshot of the agent's runtime state, useful for UI and diagnostics.
 * Combines the persona with the current model lifecycle state.
 */
export interface MentalHealthAgentSnapshot {
  id: string;
  displayName: string;
  tagline: string;
  runtime: string;
  status: MentalHealthAgentStatus;
  modelId: string | null;
  modelPath: string | null;
  loadedAt: number | null;
  error: string | null;
}

export function describeAgent(model: ModelState): MentalHealthAgentSnapshot {
  return {
    id: MENTAL_HEALTH_AGENT.id,
    displayName: MENTAL_HEALTH_AGENT.displayName,
    tagline: MENTAL_HEALTH_AGENT.tagline,
    runtime: MENTAL_HEALTH_AGENT.runtime,
    status: agentStatusFromModelStatus(model.status),
    modelId: model.modelId,
    modelPath: model.modelPath,
    loadedAt: model.loadedAt,
    error: model.error,
  };
}
