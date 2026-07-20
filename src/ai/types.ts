/**
 * Shared types for the Oppuna AI layer.
 *
 * Everything in `src/ai` runs entirely on the device. These types describe
 * the contracts between the safety engine, the rule-based fallback engine,
 * the response validator, conversation memory, and the on-device Llama agent.
 */

import type { MoodKey, SafetyCategory } from '@/types';

/** Injectable random source so composition stays testable/deterministic. */
export type Rng = () => number;

/** Conversational intents recognised by the rule engine. */
export type Intent =
  | 'greeting'
  | 'anxiety'
  | 'sadness'
  | 'anger'
  | 'loneliness'
  | 'stress'
  | 'sleep'
  | 'gratitude'
  | 'self_esteem'
  | 'relationship'
  | 'motivation'
  | 'journaling'
  | 'breathing'
  | 'grounding'
  | 'thanks'
  | 'goodbye'
  | 'positive'
  | 'help'
  | 'unknown';

/* ------------------------------------------------------------------ *
 * Messages
 * ------------------------------------------------------------------ */

export type AIMessageRole = 'user' | 'assistant' | 'system';

/** A single conversational turn as seen by the AI layer. */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
  createdAt?: number;
  intent?: Intent | null;
  mood?: MoodKey | null;
}

/* ------------------------------------------------------------------ *
 * Safety
 * ------------------------------------------------------------------ */

/** Result of running the safety engine over a user message. */
export interface SafetyAssessment {
  /** Crisis category, or null when the message is safe to coach on. */
  crisis: SafetyCategory | null;
}

/** Reasons the response validator can reject a candidate reply. */
export type ValidationViolation =
  | 'empty'
  | 'too_long'
  | 'medical_diagnosis'
  | 'therapy_claim'
  | 'medication_advice'
  | 'unsafe_content'
  | 'repetition'
  | 'excessive_questions';

export interface ValidationResult {
  ok: boolean;
  violations: ValidationViolation[];
}

/** Safety flags attached to a finished response. */
export interface SafetyFlags {
  crisis: SafetyCategory | null;
  /** Violations found in candidate replies that were rejected along the way. */
  rejectedViolations: ValidationViolation[];
}

/* ------------------------------------------------------------------ *
 * Responses
 * ------------------------------------------------------------------ */

/** Where the final reply text came from. */
export type ResponseSource = 'safety' | 'local-llm' | 'rule-engine' | 'safe-fallback';

export interface AIResponseMetadata {
  source: ResponseSource;
  /** Named AI agent that produced the reply, when a model-backed agent was used. */
  agentId?: string;
  /** Concrete local generation client/model identifier, when available. */
  clientId?: string;
  /** Whether a local LLM was available for this turn. */
  llmAvailable: boolean;
  /** Number of candidate replies rejected by the validator before success. */
  rejectedCandidates: number;
  safety: SafetyFlags;
  generatedAt: number;
}

/**
 * Legacy response shape produced by the rule engine. Kept identical to the
 * original `offlineAI.generateResponse` result so existing callers/tests
 * continue to work.
 */
export interface EngineResponse {
  reply: string;
  intent: Intent;
  mood: MoodKey | null;
  crisis: SafetyCategory | null;
  /** Optional quick-reply suggestions for the chat UI. */
  suggestions: string[];
}

/** Full response returned by the orchestrator (`generateAIResponse`). */
export interface AIChatResponse extends EngineResponse {
  meta: AIResponseMetadata;
}

/* ------------------------------------------------------------------ *
 * Model lifecycle
 * ------------------------------------------------------------------ */

/** Lifecycle state of the on-device GGUF model. */
export type ModelStatus =
  | 'idle'
  | 'checking'
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'error';

export interface ModelState {
  status: ModelStatus;
  /** Resolved local file URI for the GGUF model, when present. */
  modelPath: string | null;
  /** Human-readable model identifier derived from the filename. */
  modelId: string | null;
  /** Last error message when status is `error`. */
  error: string | null;
  /** Timestamp when the model context became ready. */
  loadedAt: number | null;
}

/** Tunable generation parameters shared by the prompt builder and LLM client. */
export interface GenerationConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
}

/* ------------------------------------------------------------------ *
 * Local LLM contracts
 * ------------------------------------------------------------------ */

export interface LLMGenerationParams {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

/** A fully built prompt, ready for an on-device model. */
export interface LLMPrompt {
  /** System instructions with all safety guardrails. */
  system: string;
  /** Recent conversation turns, oldest first, ending with the user message. */
  turns: AIMessage[];
  params?: LLMGenerationParams;
}

export type LLMFinishReason = 'stop' | 'length' | 'aborted' | 'error';

export interface LLMCompletion {
  text: string;
  finishReason: LLMFinishReason;
  /** Wall-clock generation time, for perf logging. */
  durationMs: number;
}

export type LLMTokenCallback = (token: string) => void;

export interface LLMGenerateOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Contract for an on-device text generation backend.
 *
 * Implementations must be fully offline (no network calls of any kind).
 * A native llama.cpp / MLC / ONNX-backed client can implement this later
 * without touching the rest of the app.
 */
export interface LocalLLMClient {
  /** Stable identifier, e.g. 'mock' or 'llama-3.2-1b-q4'. */
  readonly id: string;
  /** Whether the model is present and ready on this device. Must never throw. */
  isAvailable(): Promise<boolean>;
  /** Optional warm-up (load weights into memory) ahead of first generation. */
  warmUp?(): Promise<void>;
  /** One-shot generation. */
  generate(prompt: LLMPrompt, options?: LLMGenerateOptions): Promise<LLMCompletion>;
  /**
   * Streaming generation. Emits tokens through `onToken` and resolves with the
   * full completion. Callers may treat it exactly like `generate`.
   */
  generateStream(
    prompt: LLMPrompt,
    onToken: LLMTokenCallback,
    options?: LLMGenerateOptions,
  ): Promise<LLMCompletion>;
  /** Free native resources (model weights, KV cache). */
  release?(): Promise<void>;
}
