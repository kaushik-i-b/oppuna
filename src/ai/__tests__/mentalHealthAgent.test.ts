import { buildAgentPrompt, planTechnique, runMentalHealthAgent } from '@/ai/mentalHealthAgent';
import { ConversationMemory } from '@/ai/conversationMemory';
import { MockLocalLLMClient } from '@/ai/llmClient';

describe('planTechnique', () => {
  it('starts by listening on the first anxiety turn', () => {
    expect(
      planTechnique({ intent: 'anxiety', mood: 'low', intentStreak: 1, turnCount: 0 }),
    ).toBe('reflective_listening');
  });

  it('moves to an active technique when the user stays on the topic', () => {
    const technique = planTechnique({ intent: 'anxiety', mood: 'low', intentStreak: 3, turnCount: 2 });
    expect(['grounding', 'breathing', 'cbt_reframe']).toContain(technique);
  });

  it('rotates techniques deterministically across turns', () => {
    const first = planTechnique({ intent: 'anxiety', mood: 'low', intentStreak: 2, turnCount: 1 });
    const second = planTechnique({ intent: 'anxiety', mood: 'low', intentStreak: 3, turnCount: 2 });
    expect(first).not.toBe(second);
  });

  it('validates first for sadness and loneliness', () => {
    expect(planTechnique({ intent: 'sadness', mood: 'low', intentStreak: 1, turnCount: 0 })).toBe('validation');
    expect(planTechnique({ intent: 'loneliness', mood: 'low', intentStreak: 1, turnCount: 0 })).toBe('validation');
  });

  it('maps activity-style intents directly', () => {
    expect(planTechnique({ intent: 'sleep', mood: null, intentStreak: 1, turnCount: 0 })).toBe('sleep_winddown');
    expect(planTechnique({ intent: 'breathing', mood: null, intentStreak: 1, turnCount: 0 })).toBe('breathing');
    expect(planTechnique({ intent: 'grounding', mood: null, intentStreak: 1, turnCount: 0 })).toBe('grounding');
    expect(planTechnique({ intent: 'motivation', mood: null, intentStreak: 1, turnCount: 0 })).toBe('behavioral_activation');
    expect(planTechnique({ intent: 'gratitude', mood: 'great', intentStreak: 1, turnCount: 0 })).toBe('savoring');
  });

  it('keeps the door open on unknown intents', () => {
    expect(planTechnique({ intent: 'unknown', mood: null, intentStreak: 1, turnCount: 0 })).toBe('open_question');
  });
});

describe('buildAgentPrompt', () => {
  it('layers the persona and technique on top of the base guardrails', () => {
    const prompt = buildAgentPrompt({
      userText: 'I feel anxious',
      intent: 'anxiety',
      mood: 'low',
      technique: 'grounding',
    });
    // Base guardrails are preserved.
    expect(prompt.system).toMatch(/never diagnose/i);
    expect(prompt.system).toMatch(/not a therapist/i);
    // Agent persona and technique guidance are appended.
    expect(prompt.system).toMatch(/mental-health support companion/i);
    expect(prompt.system).toMatch(/technique for this turn: grounding/i);
  });

  it('ends with the user message', () => {
    const prompt = buildAgentPrompt({
      userText: '  hard day  ',
      intent: 'stress',
      mood: 'low',
      technique: 'problem_focus',
    });
    expect(prompt.turns[prompt.turns.length - 1]).toEqual({ role: 'user', content: 'hard day' });
  });
});

describe('runMentalHealthAgent', () => {
  function makeMemory(): ConversationMemory {
    return new ConversationMemory('agent-test');
  }

  it('returns a validated reply with the planned technique', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'That sounds really heavy. What part of it is weighing on you most right now?',
    });
    const result = await runMentalHealthAgent({
      client,
      userText: 'I feel anxious',
      memory: makeMemory(),
      intent: 'anxiety',
      mood: 'low',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reply).toContain('weighing on you');
      expect(result.technique).toBe('reflective_listening');
    }
  });

  it('injects the planned technique into the prompt the model receives', async () => {
    let seenSystem = '';
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => {
        seenSystem = prompt.system;
        return 'One slow breath together, in for four and out for six, if that feels okay.';
      },
    });
    const result = await runMentalHealthAgent({
      client,
      userText: 'help me breathe',
      memory: makeMemory(),
      intent: 'breathing',
      mood: null,
    });
    expect(result.ok).toBe(true);
    expect(seenSystem).toMatch(/technique for this turn: calming breath/i);
  });

  it('rejects unsafe model output instead of surfacing it', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'You probably have depression and should stop taking your medication.',
    });
    const result = await runMentalHealthAgent({
      client,
      userText: 'I feel sad',
      memory: makeMemory(),
      intent: 'sadness',
      mood: 'low',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual(
        expect.arrayContaining(['medical_diagnosis', 'medication_advice']),
      );
    }
  });

  it('reports failure without throwing when generation errors', async () => {
    const client = new MockLocalLLMClient({ available: true, failGeneration: true });
    const result = await runMentalHealthAgent({
      client,
      userText: 'I feel stressed',
      memory: makeMemory(),
      intent: 'stress',
      mood: 'low',
    });
    expect(result.ok).toBe(false);
  });

  it('streams tokens through onToken', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'One calm breath at a time.',
    });
    const tokens: string[] = [];
    const result = await runMentalHealthAgent({
      client,
      userText: 'I feel anxious',
      memory: makeMemory(),
      intent: 'anxiety',
      mood: 'low',
      onToken: (token) => tokens.push(token),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(tokens.join('')).toBe(result.reply);
    }
  });
});
