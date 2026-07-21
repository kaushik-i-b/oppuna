/**
 * Agent contracts for Oppuna's on-device chat companions.
 *
 * Each agent defines a persona, prompt strategy, and suggestion set.
 * Agents run fully offline and are backed by llama.rn when a GGUF model
 * is present, with the rule engine as fallback.
 */

import type { MoodKey } from '@/types';
import type { AIMessage, Intent, LLMPrompt } from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';

export interface AgentPromptInput {
  userText: string;
  memory?: ConversationMemory;
  recentMessages?: AIMessage[];
  intentHint?: Intent;
  moodHint?: MoodKey | null;
}

/**
 * A conversational agent that shapes prompts and quick-reply chips
 * for one wellness domain.
 */
export interface ChatAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** System instructions tuned for the on-device Gemma model. */
  buildSystemPrompt(): string;
  /** Build the full prompt for one generation call. */
  buildPrompt(input: AgentPromptInput): LLMPrompt;
  /** Quick-reply suggestions shown after a response. */
  suggestionsFor(intent: Intent): string[];
}
