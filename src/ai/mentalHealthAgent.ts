import type { MoodKey } from '@/types';
import { buildPrompt } from '@/ai/promptBuilder';
import { generateStreamWithTimeout, generateWithTimeout } from '@/ai/llmClient';
import { validateResponse } from '@/ai/responseValidator';
import type { ConversationMemory } from '@/ai/conversationMemory';
import type {
  AIMessage,
  Intent,
  LLMCompletion,
  LLMTokenCallback,
  LocalLLMClient,
  ValidationResult,
} from '@/ai/types';

export interface MentalHealthAgentInput {
  text: string;
  memory: ConversationMemory;
  intent: Intent;
  mood: MoodKey | null;
  recentMessages?: AIMessage[];
}

export interface MentalHealthAgentDeps {
  client: LocalLLMClient;
  timeoutMs: number;
  recentReplies: string[];
  onToken?: LLMTokenCallback;
}

export interface MentalHealthAgentResult {
  completion: LLMCompletion;
  candidate: string;
  verdict: ValidationResult;
}

export async function generateMentalHealthAgentReply(
  input: MentalHealthAgentInput,
  deps: MentalHealthAgentDeps,
): Promise<MentalHealthAgentResult> {
  const prompt = buildPrompt({
    userText: input.text,
    memory: input.memory,
    intentHint: input.intent,
    moodHint: input.mood,
    recentMessages: input.recentMessages,
  });

  const completion = deps.onToken
    ? await generateStreamWithTimeout(deps.client, prompt, deps.timeoutMs, deps.onToken)
    : await generateWithTimeout(deps.client, prompt, deps.timeoutMs);

  const candidate = completion.text.trim();
  const verdict = validateResponse(candidate, { recentReplies: deps.recentReplies });
  return { completion, candidate, verdict };
}
