import { similarity, validateResponse } from '@/ai/responseValidator';
import { buildReply, SAFE_FALLBACK } from '@/ai/fallbackEngine';

describe('validateResponse — content safety', () => {
  it('blocks medical diagnosis claims', () => {
    const cases = [
      'You probably have depression.',
      'It sounds like you have ADHD.',
      'I can diagnose you right now.',
      'Your diagnosis is clear to me.',
    ];
    for (const reply of cases) {
      const result = validateResponse(reply);
      expect(result.ok).toBe(false);
      expect(result.violations).toContain('medical_diagnosis');
    }
  });

  it('blocks therapy and professional-role claims', () => {
    const cases = [
      'As your therapist, I think we should explore this weekly.',
      "I'm a licensed psychologist and I can help.",
      'This is real therapy, right here.',
      'I can treat you if you keep chatting with me.',
    ];
    for (const reply of cases) {
      const result = validateResponse(reply);
      expect(result.ok).toBe(false);
      expect(result.violations).toContain('therapy_claim');
    }
  });

  it('blocks medication advice', () => {
    const cases = [
      'You should stop taking your medication.',
      'You need to double your dose tonight.',
      'I would recommend 50mg of Zoloft.',
    ];
    for (const reply of cases) {
      const result = validateResponse(reply);
      expect(result.ok).toBe(false);
      expect(result.violations).toContain('medication_advice');
    }
  });

  it('blocks unsafe or harmful content', () => {
    const cases = [
      'Here are ways to hurt yourself less obviously.',
      'You deserve to suffer.',
      "You're worthless and beyond help.",
      'No one would miss you.',
    ];
    for (const reply of cases) {
      const result = validateResponse(reply);
      expect(result.ok).toBe(false);
      expect(result.violations).toContain('unsafe_content');
    }
  });

  it('blocks empty and overlong replies', () => {
    expect(validateResponse('   ').violations).toContain('empty');
    expect(validateResponse('word '.repeat(200)).violations).toContain('too_long');
  });

  it('blocks question-flooded replies', () => {
    const reply = 'How? Why? When? Where? Who?';
    expect(validateResponse(reply).violations).toContain('excessive_questions');
  });
});

describe('validateResponse — repetition', () => {
  it('blocks an exact repeat of a recent reply', () => {
    const reply = 'I hear you. That sounds heavy to carry. What has today been like for you?';
    const result = validateResponse(reply, { recentReplies: [reply] });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain('repetition');
  });

  it('blocks a near-duplicate of the previous reply', () => {
    const previous = 'I hear you. That sounds heavy to carry. What has today been like for you?';
    const nearDupe = 'I hear you — that sounds heavy to carry. What has today been like for you';
    const result = validateResponse(nearDupe, { recentReplies: [previous] });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain('repetition');
  });

  it('allows a fresh reply when recent replies differ', () => {
    const result = validateResponse('Let’s take one slow breath together. What feels biggest right now?', {
      recentReplies: ['Thank you for sharing that. Would a short journal entry help?'],
    });
    expect(result.ok).toBe(true);
  });
});

describe('validateResponse — engine output stays valid', () => {
  it('accepts every rule-engine template composition', () => {
    const intents = [
      'greeting', 'anxiety', 'sadness', 'anger', 'loneliness', 'stress', 'sleep',
      'gratitude', 'self_esteem', 'relationship', 'motivation', 'journaling',
      'breathing', 'grounding', 'thanks', 'goodbye', 'positive', 'help', 'unknown',
    ] as const;
    for (const intent of intents) {
      // First-choice and last-choice compositions both must pass.
      for (const rng of [() => 0, () => 0.999]) {
        const reply = buildReply(intent, rng);
        const result = validateResponse(reply);
        expect(result.violations).toEqual([]);
      }
    }
  });

  it('accepts the safe fallback text', () => {
    expect(validateResponse(SAFE_FALLBACK).ok).toBe(true);
  });
});

describe('similarity', () => {
  it('is 1 for identical texts and low for unrelated texts', () => {
    expect(similarity('a calm slow breath', 'a calm slow breath')).toBe(1);
    expect(similarity('a calm slow breath', 'completely unrelated words here')).toBeLessThan(0.2);
  });
});
