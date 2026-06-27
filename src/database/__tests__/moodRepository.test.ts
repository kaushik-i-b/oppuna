import {
  clampIntensity,
  computeWeeklyInsights,
  deserializeTags,
  rowToMood,
  serializeTags,
} from '@/database/repositories/moodRepository';
import type { MoodEntry } from '@/types';

describe('mood storage helpers', () => {
  it('round-trips tags through serialization', () => {
    const tags = ['work', 'sleep'] as const;
    expect(deserializeTags(serializeTags([...tags]))).toEqual(['work', 'sleep']);
  });

  it('returns an empty array for invalid tag json', () => {
    expect(deserializeTags('not-json')).toEqual([]);
  });

  it('clamps intensity into the 1-10 range', () => {
    expect(clampIntensity(0)).toBe(1);
    expect(clampIntensity(11)).toBe(10);
    expect(clampIntensity(5.6)).toBe(6);
    expect(clampIntensity(Number.NaN)).toBe(5);
  });

  it('maps a database row to a mood entry', () => {
    const entry = rowToMood({
      id: 'a',
      mood: 'good',
      intensity: 7,
      note: 'ok',
      tags: '["work"]',
      created_at: 123,
    });
    expect(entry).toEqual({
      id: 'a',
      mood: 'good',
      intensity: 7,
      note: 'ok',
      tags: ['work'],
      createdAt: 123,
    });
  });
});

describe('computeWeeklyInsights', () => {
  const now = new Date('2026-06-25T12:00:00Z').getTime();

  function makeEntry(partial: Partial<MoodEntry>): MoodEntry {
    return {
      id: Math.random().toString(),
      mood: 'good',
      intensity: 5,
      note: null,
      tags: [],
      createdAt: now,
      ...partial,
    };
  }

  it('reports empty insights when there is no data', () => {
    const insight = computeWeeklyInsights([], now);
    expect(insight.entryCount).toBe(0);
    expect(insight.averageScore).toBeNull();
    expect(insight.dailyScores).toHaveLength(7);
  });

  it('averages mood scores across the week', () => {
    const entries = [
      makeEntry({ mood: 'great' }), // score 5
      makeEntry({ mood: 'low' }), // score 2
    ];
    const insight = computeWeeklyInsights(entries, now);
    expect(insight.entryCount).toBe(2);
    expect(insight.averageScore).toBe(3.5);
  });

  it('ranks the most common tags', () => {
    const entries = [
      makeEntry({ tags: ['work', 'sleep'] }),
      makeEntry({ tags: ['work'] }),
    ];
    const insight = computeWeeklyInsights(entries, now);
    expect(insight.topTags[0]).toEqual({ tag: 'work', count: 2 });
  });
});
