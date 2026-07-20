/**
 * Mental health agent — the on-device Llama-backed companion for chat.
 *
 * Layers a mental-health support persona on top of the local LLM client:
 *  - a deterministic technique planner picks one evidence-informed supportive
 *    technique per turn (reflective listening, grounding, CBT-style reframe,
 *    behavioural activation, …) based on intent, mood, and how long the user
 *    has stayed on the same topic,
 *  - the planner's choice is injected into the guardrailed system prompt so
 *    Llama's reply follows that technique instead of drifting,
 *  - every generated reply still has to pass the response validator before it
 *    can reach the user.
 *
 * Fully offline. The agent only ever talks to the injected `LocalLLMClient`
 * (llama.rn on device), never the network. Crisis detection happens before
 * the agent is invoked and is never delegated to the model.
 */

import { logger } from '@/utils/logger';
import type { MoodKey } from '@/types';
import type {
  AgentTechnique,
  Intent,
  LLMPrompt,
  LLMTokenCallback,
  LocalLLMClient,
  ValidationViolation,
} from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import { buildPrompt } from '@/ai/promptBuilder';
import { generateStreamWithTimeout, generateWithTimeout } from '@/ai/llmClient';
import { validateResponse } from '@/ai/responseValidator';

/* ------------------------------------------------------------------ *
 * Techniques
 * ------------------------------------------------------------------ */

export type { AgentTechnique } from '@/ai/types';

const TECHNIQUE_GUIDANCE: Record<AgentTechnique, string> = {
  reflective_listening:
    'Technique for this turn: reflective listening. Mirror back the feeling and situation in your own words so they feel heard. Do not give advice yet.',
  validation:
    'Technique for this turn: validation. Name the emotion and make clear it is an understandable response to what they described. No fixing, no silver linings.',
  grounding:
    'Technique for this turn: grounding. Briefly acknowledge the feeling, then invite one small sensory grounding step (e.g. noticing 3 things they can see or feel right now).',
  breathing:
    'Technique for this turn: calming breath. Briefly acknowledge the feeling, then offer one slow breath together (in for 4, out for 6). Keep it optional and gentle.',
  cbt_reframe:
    'Technique for this turn: gentle thought check, inspired by CBT self-help. Reflect the thought they expressed, then ask one soft question that invites a kinder or more balanced way to see it. Never label the thought as wrong or distorted.',
  behavioral_activation:
    'Technique for this turn: one tiny step. Acknowledge how hard things feel, then wonder together about one very small, doable action (a glass of water, a short stretch, a message to someone). Keep it optional.',
  self_compassion:
    'Technique for this turn: self-compassion. Invite them to speak to themselves the way they would to a good friend in the same situation. Keep it warm and concrete.',
  problem_focus:
    'Technique for this turn: shrinking the pile. Acknowledge the overload, then help them pick the single smallest piece to look at first. One question at most.',
  sleep_winddown:
    'Technique for this turn: wind-down support. Acknowledge how draining sleepless nights are, then offer one calming pre-sleep idea (dim light, slow breath, jotting worries on paper for tomorrow).',
  savoring:
    'Technique for this turn: savoring. Celebrate the good moment with them and ask one question that helps them relive or extend it.',
  open_question:
    'Technique for this turn: open door. Respond warmly and ask one open, unhurried question that invites them to share what is on their mind.',
};

/** Persona layered on top of the base guardrail prompt. */
const AGENT_PERSONA = [
  'Role: you are Oppuna’s mental-health support companion — a steady, caring presence for everyday emotional wellbeing.',
  'You draw on well-known self-help ideas (reflective listening, grounding, breathing, gentle reframing, tiny next steps) without ever presenting them as therapy or treatment.',
  'Always centre the user’s own words and feelings before offering anything.',
  'If the user asks who you are, say you are an on-device wellbeing companion, not a professional, and that everything stays on their phone.',
].join('\n');

/* ------------------------------------------------------------------ *
 * Technique planner
 * ------------------------------------------------------------------ */

export interface PlanTechniqueInput {
  intent: Intent;
  mood: MoodKey | null;
  /** Consecutive turns (incl. this one) the user has spent on this intent. */
  intentStreak: number;
  /** Total assistant turns so far in this session — used to rotate variety. */
  turnCount: number;
}

/**
 * Pick one technique for this turn. First contact with a feeling always
 * starts by listening; only when the user stays on the topic does the agent
 * move to an active technique, rotated deterministically for variety.
 */
export function planTechnique(input: PlanTechniqueInput): AgentTechnique {
  const { intent, intentStreak, turnCount } = input;

  const rotate = (options: AgentTechnique[]): AgentTechnique =>
    options[turnCount % options.length] as AgentTechnique;

  switch (intent) {
    case 'anxiety':
      if (intentStreak <= 1) return 'reflective_listening';
      return rotate(['grounding', 'breathing', 'cbt_reframe']);
    case 'sadness':
    case 'loneliness':
      if (intentStreak <= 1) return 'validation';
      return rotate(['behavioral_activation', 'self_compassion', 'reflective_listening']);
    case 'anger':
      if (intentStreak <= 1) return 'validation';
      return rotate(['breathing', 'cbt_reframe']);
    case 'stress':
      if (intentStreak <= 1) return 'reflective_listening';
      return rotate(['problem_focus', 'breathing', 'behavioral_activation']);
    case 'sleep':
      return 'sleep_winddown';
    case 'self_esteem':
      return intentStreak <= 1 ? 'validation' : 'self_compassion';
    case 'relationship':
      return intentStreak <= 1 ? 'reflective_listening' : rotate(['validation', 'cbt_reframe']);
    case 'motivation':
      return 'behavioral_activation';
    case 'gratitude':
    case 'positive':
      return 'savoring';
    case 'breathing':
      return 'breathing';
    case 'grounding':
      return 'grounding';
    case 'journaling':
      return 'open_question';
    default:
      return 'open_question';
  }
}

/* ------------------------------------------------------------------ *
 * Prompt assembly
 * ------------------------------------------------------------------ */

export interface AgentPromptInput {
  userText: string;
  memory?: ConversationMemory;
  intent: Intent;
  mood: MoodKey | null;
  technique: AgentTechnique;
}

/**
 * Build the full Llama prompt for one agent turn: base guardrails + agent
 * persona + the planned technique, followed by the conversation context.
 */
export function buildAgentPrompt(input: AgentPromptInput): LLMPrompt {
  const base = buildPrompt({
    userText: input.userText,
    memory: input.memory,
    intentHint: input.intent,
    moodHint: input.mood,
  });

  return {
    ...base,
    system: [base.system, AGENT_PERSONA, TECHNIQUE_GUIDANCE[input.technique]].join('\n\n'),
  };
}

/* ------------------------------------------------------------------ *
 * Agent turn
 * ------------------------------------------------------------------ */

/** Hard cap on on-device generation time so the chat never hangs. */
export const AGENT_TIMEOUT_MS = 6000;

export interface AgentTurnInput {
  client: LocalLLMClient;
  userText: string;
  memory: ConversationMemory;
  intent: Intent;
  mood: MoodKey | null;
  onToken?: LLMTokenCallback;
}

export type AgentTurnResult =
  | { ok: true; reply: string; technique: AgentTechnique }
  | { ok: false; technique: AgentTechnique; violations: ValidationViolation[] };

/**
 * Run one full agent turn against the local Llama model: plan a technique,
 * build the prompt, generate (optionally streaming), and validate.
 *
 * Never throws — generation errors surface as a failed result so the
 * orchestrator can fall back to the rule engine.
 */
export async function runMentalHealthAgent(input: AgentTurnInput): Promise<AgentTurnResult> {
  const technique = planTechnique({
    intent: input.intent,
    mood: input.mood,
    intentStreak: input.memory.intentStreak(input.intent) + 1,
    turnCount: input.memory.turnCount,
  });

  const prompt = buildAgentPrompt({
    userText: input.userText,
    memory: input.memory,
    intent: input.intent,
    mood: input.mood,
    technique,
  });

  try {
    const completion = input.onToken
      ? await generateStreamWithTimeout(input.client, prompt, AGENT_TIMEOUT_MS, input.onToken)
      : await generateWithTimeout(input.client, prompt, AGENT_TIMEOUT_MS);

    const candidate = completion.text.trim();
    const verdict = validateResponse(candidate, { recentReplies: input.memory.recentReplies() });

    if (completion.finishReason === 'stop' && verdict.ok) {
      return { ok: true, reply: candidate, technique };
    }

    logger.warn('Mental health agent reply rejected', {
      technique,
      violations: verdict.violations,
      finishReason: completion.finishReason,
    });
    return { ok: false, technique, violations: verdict.violations };
  } catch (error) {
    logger.warn('Mental health agent generation failed', {
      technique,
      error: String(error),
    });
    return { ok: false, technique, violations: [] };
  }
}
