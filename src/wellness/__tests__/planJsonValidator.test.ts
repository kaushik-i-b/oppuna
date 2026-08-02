import {
  extractJsonObject,
  parsePersonalizedPlanJson,
  applyPersonalizedCopy,
} from '@/wellness/planJsonValidator';
import type { WellnessPlanActivity } from '@/wellness/types';

const IDS = ['plan-act-1', 'plan-act-2'];

const validJson = JSON.stringify({
  title: 'Calm focus day',
  encouragement: 'You have a gentle plan ready.',
  explanation: 'These steps fit stress and a short time budget.',
  activities: [
    { id: 'plan-act-1', title: 'Soft breaths', description: 'Three calm rounds.' },
    { id: 'plan-act-2', title: 'Water pause', description: 'Drink mindfully.' },
  ],
});

describe('planJsonValidator', () => {
  it('extracts fenced JSON', () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('accepts valid personalization JSON', () => {
    const parsed = parsePersonalizedPlanJson(validJson, IDS);
    expect(parsed?.title).toBe('Calm focus day');
    expect(parsed?.activities).toHaveLength(2);
  });

  it('rejects missing activity ids', () => {
    const bad = JSON.stringify({
      title: 'X',
      encouragement: 'Y',
      explanation: 'Z',
      activities: [{ id: 'plan-act-1', title: 'A', description: 'B' }],
    });
    expect(parsePersonalizedPlanJson(bad, IDS)).toBeNull();
  });

  it('rejects non-JSON', () => {
    expect(parsePersonalizedPlanJson('Sure! Here is your plan.', IDS)).toBeNull();
  });

  it('applies copy onto activities', () => {
    const activities: WellnessPlanActivity[] = [
      {
        id: 'plan-act-1',
        libraryId: 'a1',
        title: 'Old',
        description: 'Old desc',
        duration: 3,
        deepLink: 'breathe',
        category: 'breathing',
      },
      {
        id: 'plan-act-2',
        libraryId: 'a2',
        title: 'Old2',
        description: 'Old2',
        duration: 2,
        deepLink: 'none',
        category: 'hydration',
      },
    ];
    const parsed = parsePersonalizedPlanJson(validJson, IDS)!;
    const next = applyPersonalizedCopy(activities, parsed);
    expect(next[0]?.title).toBe('Soft breaths');
    expect(next[1]?.description).toBe('Drink mindfully.');
  });
});
