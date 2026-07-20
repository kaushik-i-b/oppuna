import { ConversationMemory } from '@/ai/conversationMemory';
import {
  MentalHealthAgent,
  __resetMentalHealthAgentForTests,
} from '@/ai/mentalHealthAgent';
import { MockLocalLLMClient } from '@/ai/llmClient';

describe('MentalHealthAgent', () => {
  afterEach(() => {
    __resetMentalHealthAgentForTests();
  });

  it('returns unavailable when no local model is present', async () => {
    const client = new MockLocalLLMClient({ available: false });
    const agent = new MentalHealthAgent({ client });
    const memory = new ConversationMemory('session-1');

    const result = await agent.respond({
      sessionId: 'session-1',
      userText: 'I feel anxious today',
      memory,
    });

    expect(result).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('returns a validated reply from the on-device Llama client', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'That sounds heavy. What feels biggest right now? A slow breath may help.',
    });
    const agent = new MentalHealthAgent({ client });
    const memory = new ConversationMemory('session-2');

    const result = await agent.respond({
      sessionId: 'session-2',
      userText: 'I feel anxious',
      memory,
      intentHint: 'anxiety',
      moodHint: 'low',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reply).toContain('What feels biggest right now?');
    }
  });

  it('rejects unsafe model output', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'You should stop taking your medication and you probably have depression.',
    });
    const agent = new MentalHealthAgent({ client });
    const memory = new ConversationMemory('session-3');

    const result = await agent.respond({
      sessionId: 'session-3',
      userText: 'I feel anxious',
      memory,
    });

    expect(result).toEqual({
      ok: false,
      reason: 'rejected',
      violations: expect.arrayContaining(['medication_advice', 'medical_diagnosis']),
    });
  });

  it('streams tokens through onToken', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'One calm breath at a time.',
    });
    const agent = new MentalHealthAgent({ client });
    const memory = new ConversationMemory('session-4');
    const tokens: string[] = [];

    const result = await agent.respond(
      {
        sessionId: 'session-4',
        userText: 'I feel stressed',
        memory,
      },
      {
        onToken: (token) => tokens.push(token),
      },
    );

    expect(result.ok).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
    if (result.ok) {
      expect(tokens.join('')).toBe(result.reply);
    }
  });

  it('includes recent chat history in the prompt sent to the model', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => {
        const userTurns = prompt.turns.filter((turn) => turn.role === 'user').map((turn) => turn.content);
        return `Heard: ${userTurns.join(' | ')}`;
      },
    });
    const agent = new MentalHealthAgent({ client });
    const memory = new ConversationMemory('session-5');

    const result = await agent.respond({
      sessionId: 'session-5',
      userText: 'still anxious',
      memory,
      recentMessages: [
        { role: 'user', content: 'I feel anxious' },
        { role: 'assistant', content: 'That sounds tough.' },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reply).toContain('I feel anxious');
      expect(result.reply).toContain('still anxious');
    }
  });
});
