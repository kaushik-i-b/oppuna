/**
 * Bounded context builder for on-device LLM prompts.
 *
 * Never dumps the entire SQLite database into the prompt. Uses a simple
 * character/token budget so small mobile models stay within n_ctx.
 */

import type { MoodKey } from '@/types';
import type { AIMessage, Intent, LLMPrompt } from '@/ai/types';
import type { ConversationMemory } from '@/ai/conversationMemory';
import type { ChatMessage } from '@/ai/providers/LocalLLMProvider';
import { LOCAL_MODEL_CONFIG, LOCAL_MODEL_STOP_SEQUENCES } from '@/config/localModel';
import { buildMentalHealthSystemPrompt } from '@/ai/agents/mentalHealthAgent';

/** Rough chars-per-token estimate for English + chat templates. */
const CHARS_PER_TOKEN = 4;

export interface ContextBudget {
  /** Total tokens available for the prompt (excludes generation room). */
  totalPromptTokens: number;
  systemTokens: number;
  memoryTokens: number;
  recentConversationTokens: number;
  /** Reserved for the model completion. */
  generationReserveTokens: number;
}

export interface ContextBuilderInput {
  userText: string;
  systemPrompt?: string;
  memory?: ConversationMemory;
  recentMessages?: AIMessage[];
  intentHint?: Intent;
  moodHint?: MoodKey | null;
  journalSummary?: string | null;
  /** Override budgets — defaults derived from device context size. */
  budget?: Partial<ContextBudget>;
  contextSize?: number;
  maxGenerationTokens?: number;
}

export interface BuiltContext {
  messages: ChatMessage[];
  prompt: LLMPrompt;
  budget: ContextBudget;
  truncated: boolean;
}

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}

function defaultBudget(contextSize: number, maxGenerationTokens: number): ContextBudget {
  const generationReserveTokens = Math.min(
    maxGenerationTokens,
    Math.floor(contextSize * 0.2),
  );
  const totalPromptTokens = Math.max(256, contextSize - generationReserveTokens);
  return {
    totalPromptTokens,
    systemTokens: Math.min(600, Math.floor(totalPromptTokens * 0.35)),
    memoryTokens: Math.min(200, Math.floor(totalPromptTokens * 0.15)),
    recentConversationTokens: Math.floor(totalPromptTokens * 0.4),
    generationReserveTokens,
  };
}

function trimToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function buildMemoryBlock(input: ContextBuilderInput, maxTokens: number): string | null {
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
  if (input.journalSummary?.trim()) {
    parts.push(`Journal context: ${input.journalSummary.trim()}`);
  }

  if (parts.length === 0) return null;
  return trimToTokenBudget(parts.join(' '), maxTokens);
}

/**
 * Select recent turns that fit the conversation budget.
 * Drops oldest turns first. Never drops the current user message (added later).
 */
function selectRecentTurns(
  recentMessages: AIMessage[] | undefined,
  maxTokens: number,
): { turns: AIMessage[]; truncated: boolean } {
  const history = (recentMessages ?? []).filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  );

  const selected: AIMessage[] = [];
  let used = 0;
  let truncated = false;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (!message) continue;
    const cost = estimateTokens(message.content) + 4;
    if (used + cost > maxTokens) {
      truncated = true;
      break;
    }
    selected.unshift(message);
    used += cost;
  }

  return { turns: selected, truncated };
}

/**
 * Build a bounded chat context for local inference.
 *
 * Priority when trimming:
 * 1. Keep current user input
 * 2. Keep system / safety instructions
 * 3. Prefer summarized memory over raw old conversation
 * 4. Drop oldest conversation turns first
 */
export function buildContext(input: ContextBuilderInput): BuiltContext {
  const contextSize = input.contextSize ?? LOCAL_MODEL_CONFIG.contextSize;
  const maxGenerationTokens =
    input.maxGenerationTokens ?? LOCAL_MODEL_CONFIG.maxGenerationTokens;
  const budget: ContextBudget = {
    ...defaultBudget(contextSize, maxGenerationTokens),
    ...input.budget,
  };

  const systemRaw = input.systemPrompt ?? buildMentalHealthSystemPrompt();
  const system = trimToTokenBudget(systemRaw, budget.systemTokens);

  const memoryBlock = buildMemoryBlock(input, budget.memoryTokens);
  const { turns, truncated: historyTruncated } = selectRecentTurns(
    input.recentMessages,
    budget.recentConversationTokens,
  );

  const userText = input.userText.trim();
  const promptTurns: AIMessage[] = [];

  if (memoryBlock) {
    promptTurns.push({
      role: 'system',
      content: `USER CONTEXT (on-device, private): ${memoryBlock}`,
    });
  }
  promptTurns.push(...turns);
  promptTurns.push({ role: 'user', content: userText });

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...promptTurns.map((turn) => ({
      role: turn.role as ChatMessage['role'],
      content: turn.content,
    })),
  ];

  const prompt: LLMPrompt = {
    system,
    turns: promptTurns,
    messages,
    params: {
      maxTokens: maxGenerationTokens,
      temperature: LOCAL_MODEL_CONFIG.temperature,
      topP: LOCAL_MODEL_CONFIG.topP,
      stopSequences: [...LOCAL_MODEL_STOP_SEQUENCES],
    },
  };

  const truncated =
    historyTruncated ||
    system !== systemRaw ||
    estimateTokens(userText) + estimateTokens(system) > budget.totalPromptTokens;

  return { messages, prompt, budget, truncated };
}
