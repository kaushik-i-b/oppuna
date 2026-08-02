import { buildPlanPersonalizationContext } from '@/wellness/planContextBuilder';
import type { WellnessPlanActivity, WellnessPlanContext } from '@/wellness/types';

describe('planContextBuilder', () => {
  it('builds compact JSON under a soft token budget', () => {
    const context: WellnessPlanContext = {
      moods: ['anxious'],
      goals: ['reduce_stress'],
      availableMinutes: 15,
      completionRate: 0.5,
      streak: 2,
    };
    const activities: WellnessPlanActivity[] = [
      {
        id: 'a1',
        libraryId: 'lib1',
        title: 'Breath',
        description: 'Slow breaths',
        duration: 3,
        deepLink: 'breathe',
        category: 'breathing',
      },
    ];
    const json = buildPlanPersonalizationContext({
      context,
      activities,
      displayName: 'Sam',
    });
    expect(json.length).toBeLessThan(1200);
    expect(json).toContain('"name":"Sam"');
    expect(json).toContain('"id":"a1"');
  });
});
