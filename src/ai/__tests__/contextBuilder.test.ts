import { buildContext } from '@/ai/contextBuilder';
import { ConversationMemory } from '@/ai/conversationMemory';

describe('buildContext', () => {
  it('always retains the current user message', () => {
    const built = buildContext({
      userText: 'I feel overwhelmed today',
      recentMessages: [
        { role: 'user', content: 'old 1' },
        { role: 'assistant', content: 'reply 1' },
      ],
      contextSize: 1024,
      maxGenerationTokens: 128,
    });

    const last = built.messages[built.messages.length - 1];
    expect(last?.role).toBe('user');
    expect(last?.content).toBe('I feel overwhelmed today');
    expect(built.prompt.system.length).toBeGreaterThan(0);
  });

  it('preserves system instructions and trims old conversation first', () => {
    const longHistory = Array.from({ length: 40 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Turn ${i}: ${'x'.repeat(200)}`,
    }));

    const built = buildContext({
      userText: 'keep me',
      recentMessages: longHistory,
      contextSize: 1024,
      maxGenerationTokens: 200,
      budget: {
        systemTokens: 200,
        memoryTokens: 50,
        recentConversationTokens: 120,
      },
    });

    expect(built.messages[0]?.role).toBe('system');
    expect(built.truncated).toBe(true);
    expect(built.messages.some((m) => m.content === 'keep me')).toBe(true);
    expect(built.messages.length).toBeLessThan(longHistory.length + 2);
  });

  it('includes bounded memory summary when available', () => {
    const memory = new ConversationMemory('ctx-test');
    memory.recordTurn({ intent: 'anxiety', mood: 'low', reply: 'earlier reply' });

    const built = buildContext({
      userText: 'still anxious',
      memory,
      intentHint: 'anxiety',
      moodHint: 'low',
      contextSize: 2048,
    });

    const memoryTurn = built.messages.find(
      (m) => m.role === 'system' && m.content.includes('USER CONTEXT'),
    );
    expect(memoryTurn?.content).toMatch(/anxiety|low/i);
  });

  it('leaves generation reserve in the budget', () => {
    const built = buildContext({
      userText: 'hello',
      contextSize: 4096,
      maxGenerationTokens: 220,
    });
    expect(built.budget.generationReserveTokens).toBeGreaterThan(0);
    expect(built.budget.totalPromptTokens + built.budget.generationReserveTokens).toBeLessThanOrEqual(
      4096,
    );
  });
});
