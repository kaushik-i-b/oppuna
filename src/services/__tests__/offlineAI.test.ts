import {
  buildReply,
  detectIntent,
  detectMood,
  generateResponse,
  randomPrompt,
  SAFE_FALLBACK,
} from '@/services/offlineAI';

const firstChoice = () => 0;

describe('detectIntent', () => {
  it('detects anxiety', () => {
    expect(detectIntent('I feel really anxious today')).toBe('anxiety');
  });

  it('detects sleep difficulty', () => {
    expect(detectIntent("I can't sleep at night")).toBe('sleep');
  });

  it('detects gratitude vs thanks correctly', () => {
    expect(detectIntent('thank you so much')).toBe('thanks');
    expect(detectIntent('hello there')).toBe('greeting');
  });

  it('detects low self-esteem', () => {
    expect(detectIntent('I hate myself, I feel worthless')).toBe('self_esteem');
  });

  it('falls back to unknown for unrelated text', () => {
    expect(detectIntent('the quick brown fox')).toBe('unknown');
  });
});

describe('detectMood', () => {
  it('maps positive words to great', () => {
    expect(detectMood('I feel happy and grateful')).toBe('great');
  });

  it('handles negation', () => {
    expect(detectMood('I am not happy')).toBe('low');
  });

  it('maps despair to awful', () => {
    expect(detectMood('everything feels hopeless')).toBe('awful');
  });

  it('returns null when no mood words present', () => {
    expect(detectMood('the meeting is at noon')).toBeNull();
  });
});

describe('buildReply', () => {
  it('composes a natural-length reply deterministically', () => {
    const reply = buildReply('anxiety', firstChoice);
    expect(reply.startsWith('Anxiety can hit hard — glad you said something.')).toBe(true);
    expect(reply.length).toBeGreaterThan(0);
    expect(reply.split('?').length - 1).toBeLessThanOrEqual(2);
  });

  it('never returns an empty string for any intent', () => {
    const intents = ['greeting', 'sadness', 'anger', 'unknown'] as const;
    for (const intent of intents) {
      expect(buildReply(intent, firstChoice).length).toBeGreaterThan(0);
    }
  });
});

describe('generateResponse', () => {
  it('returns a supportive reply with suggestions for normal input', () => {
    const result = generateResponse('I feel a bit anxious', { rng: firstChoice });
    expect(result.crisis).toBeNull();
    expect(result.intent).toBe('anxiety');
    expect(result.reply.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('never includes coaching suggestions during a crisis', () => {
    const result = generateResponse('I want to kill myself');
    expect(result.crisis).toBe('suicide');
    expect(result.suggestions).toHaveLength(0);
  });

  it('exposes a safe fallback constant', () => {
    expect(SAFE_FALLBACK.length).toBeGreaterThan(0);
  });
});

describe('randomPrompt', () => {
  it('returns a deterministic prompt with a seeded rng', () => {
    expect(randomPrompt(firstChoice)).toBe(
      'What is one thing that felt heavy today, and one thing that felt a little lighter?',
    );
  });
});
