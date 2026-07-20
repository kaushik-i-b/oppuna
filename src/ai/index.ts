/**
 * Oppuna AI layer — fully offline.
 *
 * - `generateAIResponse` is the orchestrated entry point for chat.
 * - `fallbackEngine` holds the deterministic rule-based engine.
 * - `safetyEngine` runs strict crisis detection before anything else.
 * - `llmClient` / `localLLMClient` — on-device LLM via llama.rn
 * - `modelManager` — GGUF discovery and lifecycle in local storage
 */

export * from '@/ai/types';
export { DEFAULT_AGENT_ID, getAgentProfile } from '@/ai/agents';
export type { AgentProfile } from '@/ai/agents';
export { generateAIResponse } from '@/ai/engine';
export type { GenerateAIResponseInput, GenerateAIResponseDeps } from '@/ai/engine';
export { assessSafety, detectCrisis, CRISIS_PATTERNS, CRISIS_REPLY } from '@/ai/safetyEngine';
export {
  ConversationMemory,
  getConversationMemory,
  resetConversationMemory,
} from '@/ai/conversationMemory';
export {
  buildReply,
  composeReply,
  detectIntent,
  detectMood,
  generateResponse,
  randomPrompt,
  suggestionsFor,
  SAFE_FALLBACK,
  JOURNALING_PROMPTS,
  BREATHING_SUGGESTIONS,
  GROUNDING_SUGGESTIONS,
  SLEEP_SUGGESTIONS,
  CBT_TEMPLATES,
  MINDFULNESS_TEMPLATES,
} from '@/ai/fallbackEngine';
export type { GenerateOptions } from '@/ai/fallbackEngine';
export { buildPrompt, buildSystemPrompt } from '@/ai/promptBuilder';
export type { PromptInput } from '@/ai/promptBuilder';
export { validateResponse, similarity } from '@/ai/responseValidator';
export type { ValidationContext } from '@/ai/responseValidator';
export {
  MockLocalLLMClient,
  LLMUnavailableError,
  LLMGenerationError,
  configureDefaultLocalLLMClient,
  setLocalLLMClient,
  getLocalLLMClient,
  isLLMAvailable,
  generateWithTimeout,
  generateStreamWithTimeout,
} from '@/ai/llmClient';
export type { MockLocalLLMClientOptions } from '@/ai/llmClient';
export { LlamaRnLocalLLMClient } from '@/ai/localLLMClient';
export {
  initializeModelManager,
  getModelState,
  getModelPath,
  getModelsDirectory,
  isModelReady,
  subscribeToModelState,
} from '@/ai/modelManager';
