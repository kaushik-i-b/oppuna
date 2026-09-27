import {
  applyExcludedTopics,
  computeReflectionPatterns,
  rowToReflection,
} from '@/voice/reflectionRepository';
import type { PersistedReflection } from '@/voice/types';

function makeReflection(overrides: Partial<PersistedReflection> = {}): PersistedReflection {
  return {
    id: 'r1',
    sessionId: 's1',
    summary: 'A hard day at work.',
    mood: 'exhausted',
    themes: ['work'],
    concerns: ['switching off'],
    positiveMoments: ['evening walk helped'],
    commitments: ['walk tomorrow'],
    excludedTopics: [],
    userApproved: true,
    isDemo: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('applyExcludedTopics', () => {
  it('removes sentences mentioning an excluded topic', () => {
    const summary =
      'Work has been stressful recently. I had an argument with my manager about deadlines. Evening walks help me unwind.';
    const result = applyExcludedTopics(summary, ['manager']);
    expect(result).not.toMatch(/manager/i);
    expect(result).toMatch(/stressful/i);
    expect(result).toMatch(/walks/i);
  });

  it('keeps the summary intact when no topics are excluded', () => {
    const summary = 'A calm morning. I felt lighter after breakfast.';
    expect(applyExcludedTopics(summary, [])).toBe(summary);
  });

  it('is case-insensitive', () => {
    const result = applyExcludedTopics('My Manager called late.', ['manager']);
    expect(result).toBe('');
  });
});

describe('rowToReflection', () => {
  it('parses JSON columns into arrays', () => {
    const parsed = rowToReflection({
      id: 'r1',
      session_id: 's1',
      summary: 's',
      mood: 'okay',
      themes_json: '["work","sleep"]',
      concerns_json: '[]',
      positive_moments_json: '["tea"]',
      commitments_json: 'not-json',
      excluded_topics_json: '["manager"]',
      user_approved: 1,
      is_demo: 0,
      created_at: 123,
    });
    expect(parsed.themes).toEqual(['work', 'sleep']);
    expect(parsed.commitments).toEqual([]);
    expect(parsed.excludedTopics).toEqual(['manager']);
    expect(parsed.userApproved).toBe(true);
  });
});

describe('computeReflectionPatterns', () => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  it('derives top themes from real stored reflections', () => {
    const reflections = [
      makeReflection({ themes: ['work', 'sleep'], createdAt: now - day }),
      makeReflection({ themes: ['work'], createdAt: now - 2 * day }),
    ];
    const patterns = computeReflectionPatterns(reflections, '7d', now);
    expect(patterns.reflectionCount).toBe(2);
    expect(patterns.topThemes[0]).toMatchObject({ theme: 'work', count: 2 });
  });

  it('never fabricates trends when data is insufficient', () => {
    const patterns = computeReflectionPatterns([], '7d', now);
    expect(patterns.reflectionCount).toBe(0);
    expect(patterns.moodTrend).toBe('insufficient');
    expect(patterns.summary).toMatch(/not enough/i);
  });

  it('ignores reflections outside the window and demo rows', () => {
    const reflections = [
      makeReflection({ themes: ['work'], createdAt: now - 40 * day }),
      makeReflection({ themes: ['sleep'], createdAt: now - day, isDemo: true }),
    ];
    const patterns = computeReflectionPatterns(reflections, '7d', now);
    expect(patterns.reflectionCount).toBe(0);
    expect(patterns.topThemes).toEqual([]);
  });

  it('detects a falling mood trend from real moods', () => {
    const reflections = [
      makeReflection({ mood: 'good', createdAt: now - 5 * day }),
      makeReflection({ mood: 'okay', createdAt: now - 4 * day }),
      makeReflection({ mood: 'exhausted', createdAt: now - day }),
      makeReflection({ mood: 'stressed', createdAt: now - 2 * day }),
    ];
    const patterns = computeReflectionPatterns(reflections, '7d', now);
    expect(patterns.moodTrend).toBe('falling');
  });
});
