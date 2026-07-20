/**
 * Oppuna AI layer — fully offline.
 *
 * - `generateAIResponse` is the orchestrated entry point for chat.
 * - `agents` — chat companions (mental health agent backed by llama.rn)
 * - `fallbackEngine` holds the deterministic rule-based engine.
 * - `safetyEngine` runs strict crisis detection before anything else.
 * - `providers` — LocalLLMProvider abstraction (llama.rn, fake)
 * - `llmClient` / `localLLMClient` — on-device LLM via llama.rn
 * - `modelManager` — GGUF discovery, integrity, and lifecycle
 * - `contextBuilder` — bounded prompt context
 */

export * from '@/ai/types';
export * from '@/ai/agents';
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
export { buildContext } from '@/ai/contextBuilder';
export type { ContextBuilderInput, BuiltContext, ContextBudget } from '@/ai/contextBuilder';
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
  FakeLocalLLMProvider,
  LlamaRnProvider,
  LocalLLMProviderError,
} from '@/ai/providers';
export type {
  ChatMessage as ProviderChatMessage,
  GenerationOptions as ProviderGenerationOptions,
  LocalLLMProvider,
} from '@/ai/providers';
export {
  initializeModel,
  initializeModelManager,
  retryModelInitialization,
  getModelStatus,
  getModelState,
  getModelPath,
  getModelsDirectory,
  isModelReady,
  generate,
  cancelGeneration,
  unloadModel,
  subscribeToModelState,
} from '@/ai/modelManager';
