import { generateAIResponse } from '@/ai/engine';
import { resetConversationMemory } from '@/ai/conversationMemory';
import { DEFAULT_AGENT_ID } from '@/ai/agents';
import { MockLocalLLMClient } from '@/ai/llmClient';
import { SAFE_FALLBACK } from '@/ai/fallbackEngine';

let sessionCounter = 0;
function freshSession(): string {
  sessionCounter += 1;
  return `test-session-${sessionCounter}`;
}

describe('generateAIResponse — safety first', () => {
  it('returns the crisis flow for crisis input, with no coaching suggestions', async () => {
    const response = await generateAIResponse({ sessionId: freshSession(), text: 'I want to kill myself' });
    expect(response.crisis).toBe('suicide');
    expect(response.suggestions).toHaveLength(0);
    expect(response.meta.source).toBe('safety');
  });

  it('runs crisis detection even when an LLM is available', async () => {
    const client = new MockLocalLLMClient({ available: true, reply: 'Everything is fine!' });
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I took too many pills' },
      { client },
    );
    expect(response.crisis).toBe('medical_emergency');
    expect(response.meta.source).toBe('safety');
    expect(response.reply).not.toBe('Everything is fine!');
  });
});

describe('generateAIResponse — fallback engine path (default: no LLM)', () => {
  it('answers with the rule engine when no LLM is available', async () => {
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I feel anxious today' },
      { rng: () => 0 },
    );
    expect(response.meta.source).toBe('rule-engine');
    expect(response.meta.llmAvailable).toBe(false);
    expect(response.intent).toBe('anxiety');
    expect(response.crisis).toBeNull();
    expect(response.reply.length).toBeGreaterThan(0);
    expect(response.suggestions.length).toBeGreaterThan(0);
  });

  it('varies consecutive replies for the same repeated message', async () => {
    const sessionId = freshSession();
    const replies: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const response = await generateAIResponse(
        { sessionId, text: 'I feel anxious about work' },
        { rng: () => 0 },
      );
      replies.push(response.reply);
    }
    for (let i = 1; i < replies.length; i += 1) {
      expect(replies[i]).not.toBe(replies[i - 1]);
    }
    resetConversationMemory(sessionId);
  });

  it('acknowledges a repeated topic instead of restarting from scratch', async () => {
    const sessionId = freshSession();
    await generateAIResponse({ sessionId, text: 'I feel anxious' }, { rng: () => 0 });
    await generateAIResponse({ sessionId, text: 'still anxious' }, { rng: () => 0 });
    const third = await generateAIResponse({ sessionId, text: 'so anxious again' }, { rng: () => 0 });
    // After 2+ turns on the same topic the opener acknowledges the repetition.
    expect(third.reply).toMatch(/still|keeps coming back|touched on this|hasn’t eased/i);
    resetConversationMemory(sessionId);
  });
});

describe('generateAIResponse — LLM path', () => {
  it('uses a validated LLM reply when the model is available', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'That sounds heavy. What feels biggest right now? A slow breath may help.',
    });
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I feel anxious' },
      { client },
    );
    expect(response.meta.source).toBe('local-llm');
    expect(response.meta.agentId).toBe(DEFAULT_AGENT_ID);
    expect(response.meta.clientId).toBe('mock');
    expect(response.meta.llmAvailable).toBe(true);
    expect(response.reply).toContain('What feels biggest right now?');
  });

  it('passes recent local chat history to the Llama mental health agent', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => {
        expect(prompt.turns.some((turn) => turn.content === 'My manager criticized me yesterday')).toBe(true);
        return 'That criticism still seems to be sitting with you. What part feels hardest right now?';
      },
    });
    const response = await generateAIResponse(
      {
        sessionId: freshSession(),
        text: 'It feels worse today',
        recentMessages: [
          { role: 'user', content: 'My manager criticized me yesterday' },
          { role: 'assistant', content: 'That sounds painful.' },
        ],
      },
      { client },
    );
    expect(response.meta.source).toBe('local-llm');
    expect(response.reply).toContain('criticism');
  });

  it('rejects an unsafe LLM reply and falls back to the rule engine', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'You should stop taking your medication and you probably have depression.',
    });
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I feel anxious' },
      { client, rng: () => 0 },
    );
    expect(response.meta.source).toBe('rule-engine');
    expect(response.reply).not.toContain('medication');
    expect(response.meta.safety.rejectedViolations).toEqual(
      expect.arrayContaining(['medication_advice', 'medical_diagnosis']),
    );
  });

  it('falls back to the rule engine when generation fails', async () => {
    const client = new MockLocalLLMClient({ available: true, failGeneration: true });
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I feel stressed' },
      { client, rng: () => 0 },
    );
    expect(response.meta.source).toBe('rule-engine');
    expect(response.reply.length).toBeGreaterThan(0);
  });

  it('streams tokens through onToken when the LLM path is used', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'One calm breath at a time.',
    });
    const tokens: string[] = [];
    const response = await generateAIResponse(
      { sessionId: freshSession(), text: 'I feel anxious' },
      { client, onToken: (token) => tokens.push(token) },
    );
    expect(response.meta.source).toBe('local-llm');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toBe(response.reply);
  });
});

describe('generateAIResponse — last resort', () => {
  it('exposes a non-empty safe fallback constant', () => {
    expect(SAFE_FALLBACK.length).toBeGreaterThan(0);
  });
});
