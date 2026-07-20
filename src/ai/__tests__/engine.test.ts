import { generateAIResponse } from '@/ai/engine';
import { resetConversationMemory } from '@/ai/conversationMemory';
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
    expect(response.meta.llmAvailable).toBe(true);
    expect(response.reply).toContain('What feels biggest right now?');
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

  it('passes prior conversation history into the LLM prompt', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) =>
        `saw ${prompt.turns.filter((turn) => turn.role !== 'system').length} turns. How are you now?`,
    });
    const response = await generateAIResponse(
      {
        sessionId: freshSession(),
        text: 'still can’t sleep',
        history: [
          { role: 'user', content: 'I feel anxious at night' },
          { role: 'assistant', content: 'That sounds tough. What is on your mind?' },
        ],
      },
      { client },
    );
    expect(response.meta.source).toBe('local-llm');
    // 2 history turns + the current user message = 3 non-system turns.
    expect(response.reply).toContain('saw 3 turns');
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
