import {
  ConversationMemory,
  getConversationMemory,
  resetConversationMemory,
} from '@/ai/conversationMemory';

describe('ConversationMemory', () => {
  it('tracks recent intents and moods, most recent first', () => {
    const memory = new ConversationMemory('s1');
    memory.recordTurn({ intent: 'anxiety', mood: 'low', reply: 'a' });
    memory.recordTurn({ intent: 'sleep', mood: null, reply: 'b' });
    memory.recordTurn({ intent: 'stress', mood: 'okay', reply: 'c' });

    expect(memory.recentIntents(2)).toEqual(['stress', 'sleep']);
    expect(memory.recentMoods()).toEqual(['okay', 'low']);
    expect(memory.recentReplies(2)).toEqual(['c', 'b']);
    expect(memory.turnCount).toBe(3);
  });

  it('computes intent streaks from the latest turn backwards', () => {
    const memory = new ConversationMemory('s2');
    memory.recordTurn({ intent: 'sleep', mood: null, reply: 'a' });
    memory.recordTurn({ intent: 'anxiety', mood: null, reply: 'b' });
    memory.recordTurn({ intent: 'anxiety', mood: null, reply: 'c' });

    expect(memory.intentStreak('anxiety')).toBe(2);
    expect(memory.intentStreak('sleep')).toBe(0);
  });

  it('remembers which template lines were used and resets cleanly', () => {
    const memory = new ConversationMemory('s3');
    expect(memory.lastUsedTurn('line-a')).toBe(-1);
    memory.noteLineUsed('line-a');
    expect(memory.lastUsedTurn('line-a')).toBe(0);

    memory.recordTurn({ intent: 'unknown', mood: null, reply: 'x' });
    memory.noteLineUsed('line-b');
    expect(memory.lastUsedTurn('line-b')).toBe(1);

    memory.reset();
    expect(memory.lastUsedTurn('line-a')).toBe(-1);
    expect(memory.turnCount).toBe(0);
    expect(memory.recentReplies()).toEqual([]);
  });
});

describe('memory registry', () => {
  it('returns the same instance per session and drops it on reset', () => {
    const a1 = getConversationMemory('session-x');
    const a2 = getConversationMemory('session-x');
    expect(a1).toBe(a2);

    a1.recordTurn({ intent: 'anxiety', mood: 'low', reply: 'hello' });
    resetConversationMemory('session-x');

    const fresh = getConversationMemory('session-x');
    expect(fresh.turnCount).toBe(0);
  });
});
