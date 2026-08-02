import { mentalHealthAgent, buildMentalHealthSystemPrompt } from '@/ai/agents/mentalHealthAgent';
import { DEFAULT_AGENT_ID, getAgent } from '@/ai/agents/registry';
import { ConversationMemory } from '@/ai/conversationMemory';

describe('mentalHealthAgent', () => {
  it('has the expected id and name', () => {
    expect(mentalHealthAgent.id).toBe('mental-health');
    expect(mentalHealthAgent.name).toBe('Mental Health Companion');
  });

  it('encodes mental health guardrails in the system prompt', () => {
    const system = buildMentalHealthSystemPrompt();
    expect(system).toMatch(/mental wellness companion/i);
    expect(system).toMatch(/daily wellness plan/i);
    expect(system).toMatch(/not a therapist/i);
    expect(system).toMatch(/do not diagnose/i);
    expect(system).toMatch(/medication/i);
    expect(system).toMatch(/on the user/i);
  });

  it('ends the prompt with the trimmed user message', () => {
    const prompt = mentalHealthAgent.buildPrompt({ userText: '  I feel anxious  ' });
    const last = prompt.turns[prompt.turns.length - 1];
    expect(last).toEqual({ role: 'user', content: 'I feel anxious' });
  });

  it('includes recent chat history for on-device model context', () => {
    const recentMessages = [
      { role: 'user' as const, content: 'I had a rough day' },
      { role: 'assistant' as const, content: 'That sounds heavy.' },
    ];
    const prompt = mentalHealthAgent.buildPrompt({
      userText: 'still feeling low',
      recentMessages,
    });
    expect(prompt.turns).toHaveLength(3);
    expect(prompt.turns[0]?.content).toBe('I had a rough day');
    expect(prompt.turns[2]?.content).toBe('still feeling low');
  });

  it('summarises session memory into a private context turn', () => {
    const memory = new ConversationMemory('s');
    memory.recordTurn({ intent: 'anxiety', mood: 'low', reply: 'x' });

    const prompt = mentalHealthAgent.buildPrompt({
      userText: 'still anxious',
      memory,
      intentHint: 'anxiety',
      moodHint: 'low',
    });
    const context = prompt.turns[0];
    expect(context?.role).toBe('system');
    expect(context?.content).toContain('anxiety');
    expect(context?.content).toContain('low');
  });

  it('returns suggestions for known intents', () => {
    const suggestions = mentalHealthAgent.suggestionsFor('anxiety');
    expect(suggestions.length).toBeGreaterThan(0);
  });
});

describe('agent registry', () => {
  it('returns the mental health agent by default', () => {
    expect(getAgent()).toBe(mentalHealthAgent);
    expect(getAgent(DEFAULT_AGENT_ID)).toBe(mentalHealthAgent);
  });

  it('throws for unknown agent ids', () => {
    expect(() => getAgent('unknown-agent')).toThrow(/unknown chat agent/i);
  });
});
