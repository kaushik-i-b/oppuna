import { buildPrompt, buildSystemPrompt } from '@/ai/promptBuilder';
import { ConversationMemory } from '@/ai/conversationMemory';
import { MENTAL_HEALTH_AGENT } from '@/ai/agents';

describe('buildSystemPrompt', () => {
  it('encodes the hard guardrails', () => {
    const system = buildSystemPrompt();
    expect(system).toMatch(/never diagnose/i);
    expect(system).toMatch(/medication/i);
    expect(system).toMatch(/not a therapist/i);
    expect(system).toMatch(/offline/i);
  });

  it('injects the mental health agent persona while keeping the hard rules', () => {
    const system = buildSystemPrompt(MENTAL_HEALTH_AGENT);
    expect(system).toMatch(/mental health support companion/i);
    expect(system).toMatch(/grounding/i);
    // Guardrails are shared by every agent.
    expect(system).toMatch(/never diagnose/i);
    expect(system).toMatch(/medication/i);
    expect(system).toMatch(/not a therapist/i);
  });
});

describe('buildPrompt', () => {
  it('ends with the trimmed user message', () => {
    const prompt = buildPrompt({ userText: '  I feel anxious  ' });
    const last = prompt.turns[prompt.turns.length - 1];
    expect(last).toEqual({ role: 'user', content: 'I feel anxious' });
  });

  it('summarises session memory into a private context turn', () => {
    const memory = new ConversationMemory('s');
    memory.recordTurn({ intent: 'anxiety', mood: 'low', reply: 'x' });
    memory.recordTurn({ intent: 'sleep', mood: 'low', reply: 'y' });

    const prompt = buildPrompt({ userText: 'still awake', memory, intentHint: 'sleep', moodHint: 'low' });
    const context = prompt.turns[0];
    expect(context?.role).toBe('system');
    expect(context?.content).toContain('sleep');
    expect(context?.content).toContain('anxiety');
    expect(context?.content).toContain('low');
  });

  it('uses the selected agent for the system prompt', () => {
    const companionPrompt = buildPrompt({ userText: 'hello' });
    const agentPrompt = buildPrompt({ userText: 'hello', agentId: 'mental_health' });
    expect(companionPrompt.system).not.toBe(agentPrompt.system);
    expect(agentPrompt.system).toMatch(/mental health support companion/i);
  });

  it('caps included history and keeps only user/assistant turns', () => {
    const recentMessages = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `turn ${i}`,
    }));
    const prompt = buildPrompt({ userText: 'hello', recentMessages });
    // 8 history turns + final user message.
    expect(prompt.turns).toHaveLength(9);
    expect(prompt.turns[0]?.content).toBe('turn 12');
  });
});
