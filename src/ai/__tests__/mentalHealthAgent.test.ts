import { getActiveAgent, MENTAL_HEALTH_AGENT } from '@/ai/mentalHealthAgent';
import { buildPrompt, buildSystemPrompt } from '@/ai/promptBuilder';
import { generateAIResponse } from '@/ai/engine';
import { MockLocalLLMClient } from '@/ai/llmClient';
import type { LLMPrompt } from '@/ai/types';

describe('mental health agent profile', () => {
  it('is the active agent', () => {
    expect(getActiveAgent()).toBe(MENTAL_HEALTH_AGENT);
    expect(MENTAL_HEALTH_AGENT.id).toBe('mental-health-companion');
  });

  it('drives the system prompt with mental health support guidance', () => {
    const system = buildSystemPrompt();
    expect(system).toBe(MENTAL_HEALTH_AGENT.systemPrompt);
    expect(system).toMatch(/mental health/i);
    expect(system).toMatch(/never diagnose/i);
    expect(system).toMatch(/medication/i);
    expect(system).toMatch(/not a therapist/i);
    expect(system).toMatch(/offline/i);
    expect(system).toMatch(/self-compassion/i);
  });

  it('supplies its generation parameters to built prompts', () => {
    const prompt = buildPrompt({ userText: 'hello' });
    expect(prompt.params).toEqual(MENTAL_HEALTH_AGENT.params);
  });
});

describe('chat history reaches the on-device agent', () => {
  it('forwards recent messages into the LLM prompt', async () => {
    let seenPrompt: LLMPrompt | null = null;
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => {
        seenPrompt = prompt;
        return 'That sounds heavy. What feels biggest right now?';
      },
    });

    const response = await generateAIResponse(
      {
        sessionId: 'history-session',
        text: 'I could not sleep again',
        recentMessages: [
          { role: 'user', content: 'I have been anxious all week' },
          { role: 'assistant', content: 'That sounds exhausting. What is weighing on you most?' },
        ],
      },
      { client },
    );

    expect(response.meta.source).toBe('local-llm');
    const prompt = seenPrompt as LLMPrompt | null;
    expect(prompt).not.toBeNull();
    const contents = prompt!.turns.map((turn) => turn.content);
    expect(contents).toContain('I have been anxious all week');
    expect(contents).toContain('That sounds exhausting. What is weighing on you most?');
    expect(contents[contents.length - 1]).toBe('I could not sleep again');
    expect(prompt!.system).toBe(MENTAL_HEALTH_AGENT.systemPrompt);
  });
});
