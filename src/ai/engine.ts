/**
 * AI orchestrator — the single entry point the chat UI calls.
 *
 * Pipeline for every user message:
 *   1. Safety engine (strict crisis detection) — always first, never skipped.
 *   2. Local LLM, if one is available — generated reply must pass the
 *      response validator or it is discarded.
 *   3. Rule-based fallback engine with conversation memory (repetition
 *      prevention + variation) — also validated, with retries.
 *   4. Safe fallback text as the last resort.
 *
 * Fully offline. No network calls on any path.
 */

import { logger } from '@/utils/logger';
import type { AIChatResponse, LLMTokenCallback, LocalLLMClient, Rng, ValidationViolation } from '@/ai/types';
import { assessSafety, CRISIS_REPLY } from '@/ai/safetyEngine';
import { getConversationMemory } from '@/ai/conversationMemory';
import {
  composeReply,
  detectIntent,
  detectMood,
  SAFE_FALLBACK,
  suggestionsFor,
} from '@/ai/fallbackEngine';
import { buildPrompt } from '@/ai/promptBuilder';
import { generateStreamWithTimeout, generateWithTimeout, getLocalLLMClient, isLLMAvailable } from '@/ai/llmClient';
import { validateResponse } from '@/ai/responseValidator';

/** Attempts at composing a non-repetitive rule-based reply before giving up. */
const MAX_COMPOSE_ATTEMPTS = 3;
/** Hard cap on on-device LLM generation time so the chat never hangs. */
const LLM_TIMEOUT_MS = 6000;

export interface GenerateAIResponseInput {
  /** Chat session id — scopes conversation memory. */
  sessionId: string;
  /** Raw user message. */
  text: string;
}

export interface GenerateAIResponseDeps {
  /** Injectable for tests. Defaults to the registered client. */
  client?: LocalLLMClient;
  /** Injectable random source for deterministic tests. */
  rng?: Rng;
  /** Optional streaming callback — emits tokens as the local LLM generates. */
  onToken?: LLMTokenCallback;
}

export class LlamaMentalHealthAgent {
  readonly id = 'oppuna-llama-mental-health-agent';

  async respondToChat(
    input: GenerateAIResponseInput,
    deps: GenerateAIResponseDeps = {},
  ): Promise<AIChatResponse> {
    const rng = deps.rng ?? Math.random;
    const client = deps.client ?? getLocalLLMClient();
    const text = input.text.trim();
    const memory = getConversationMemory(input.sessionId);
    const rejectedViolations: ValidationViolation[] = [];

    // 1. Safety first — a crisis stops everything else.
    const safety = assessSafety(text);
    if (safety.crisis) {
      return {
        reply: CRISIS_REPLY,
        intent: 'unknown',
        mood: detectMood(text),
        crisis: safety.crisis,
        suggestions: [],
        meta: {
          source: 'safety',
          llmAvailable: false,
          rejectedCandidates: 0,
          safety: { crisis: safety.crisis, rejectedViolations: [] },
          generatedAt: Date.now(),
        },
      };
    }

    const intent = detectIntent(text);
    const mood = detectMood(text);
    const recentReplies = memory.recentReplies();

    // 2. Local Llama path: runs through llama.rn when a GGUF model is present on device.
    const llmAvailable = await isLLMAvailable(client);
    if (llmAvailable) {
      try {
        const prompt = buildPrompt({ userText: text, memory, intentHint: intent, moodHint: mood });
        const completion = deps.onToken
          ? await generateStreamWithTimeout(client, prompt, LLM_TIMEOUT_MS, deps.onToken)
          : await generateWithTimeout(client, prompt, LLM_TIMEOUT_MS);
        const candidate = completion.text.trim();
        const verdict = validateResponse(candidate, { recentReplies });

        if (completion.finishReason === 'stop' && verdict.ok) {
          memory.recordTurn({ intent, mood, reply: candidate });
          return {
            reply: candidate,
            intent,
            mood,
            crisis: null,
            suggestions: suggestionsFor(intent),
            meta: {
              source: 'local-llm',
              llmAvailable,
              rejectedCandidates: 0,
              safety: { crisis: null, rejectedViolations: [] },
              generatedAt: Date.now(),
            },
          };
        }
        rejectedViolations.push(...verdict.violations);
        logger.warn('LLM reply rejected, falling back to rule engine', {
          violations: verdict.violations,
          finishReason: completion.finishReason,
        });
      } catch (error) {
        logger.warn('LLM generation failed, falling back to rule engine', { error: String(error) });
      }
    }

    // 3. Rule-based fallback engine with validation + retries.
    let rejectedCandidates = rejectedViolations.length > 0 ? 1 : 0;
    for (let attempt = 0; attempt < MAX_COMPOSE_ATTEMPTS; attempt += 1) {
      let candidate: string;
      try {
        candidate = composeReply(intent, memory, rng, text);
      } catch (error) {
        logger.error('Rule engine composition failed', { error: String(error) });
        break;
      }
      const verdict = validateResponse(candidate, { recentReplies });
      if (verdict.ok) {
        memory.recordTurn({ intent, mood, reply: candidate });
        return {
          reply: candidate,
          intent,
          mood,
          crisis: null,
          suggestions: suggestionsFor(intent),
          meta: {
            source: 'rule-engine',
            llmAvailable,
            rejectedCandidates,
            safety: { crisis: null, rejectedViolations },
            generatedAt: Date.now(),
          },
        };
      }
      rejectedCandidates += 1;
      rejectedViolations.push(...verdict.violations);
    }

    // 4. Last resort — fixed, human-authored safe text.
    memory.recordTurn({ intent, mood, reply: SAFE_FALLBACK });
    return {
      reply: SAFE_FALLBACK,
      intent,
      mood,
      crisis: null,
      suggestions: suggestionsFor('unknown'),
      meta: {
        source: 'safe-fallback',
        llmAvailable,
        rejectedCandidates,
        safety: { crisis: null, rejectedViolations },
        generatedAt: Date.now(),
      },
    };
  }
}

export const mentalHealthAgent = new LlamaMentalHealthAgent();

export async function generateAIResponse(
  input: GenerateAIResponseInput,
  deps: GenerateAIResponseDeps = {},
): Promise<AIChatResponse> {
  return mentalHealthAgent.respondToChat(input, deps);
}
