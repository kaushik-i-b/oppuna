import { WELLNESS_ACTIVITY_LIBRARY } from '@/wellness/activityLibrary';
import { buildDraftPlan, careKindForPlanActivity } from '@/wellness/ruleEngine';

describe('activity library', () => {
  it('has at least 150 activities with required fields', () => {
    expect(WELLNESS_ACTIVITY_LIBRARY.length).toBeGreaterThanOrEqual(150);
    for (const activity of WELLNESS_ACTIVITY_LIBRARY.slice(0, 20)) {
      expect(activity.id).toBeTruthy();
      expect(activity.title).toBeTruthy();
      expect(activity.durationMin).toBeGreaterThan(0);
      expect(activity.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('buildDraftPlan', () => {
  it('respects available minutes and returns activities', () => {
    const draft = buildDraftPlan({
      moods: ['anxious', 'stressed'],
      goals: ['reduce_stress', 'anxiety'],
      availableMinutes: 15,
      completionRate: 0.5,
      seed: 20260725,
    });
    expect(draft.activities.length).toBeGreaterThanOrEqual(1);
    expect(draft.estimatedMinutes).toBeLessThanOrEqual(15);
    expect(draft.title).toBeTruthy();
    expect(draft.explanation).toBeTruthy();
  });

  it('is deterministic for the same seed', () => {
    const a = buildDraftPlan({
      moods: ['tired'],
      goals: ['better_sleep'],
      availableMinutes: 20,
      seed: 42,
    });
    const b = buildDraftPlan({
      moods: ['tired'],
      goals: ['better_sleep'],
      availableMinutes: 20,
      seed: 42,
    });
    expect(a.activities.map((x) => x.libraryId)).toEqual(b.activities.map((x) => x.libraryId));
  });

  it('maps care kinds for deep links', () => {
    const draft = buildDraftPlan({
      moods: ['anxious'],
      goals: ['anxiety'],
      availableMinutes: 15,
      seed: 1,
    });
    const kinds = draft.activities.map((a) => careKindForPlanActivity(a));
    expect(kinds.some((k) => k !== null)).toBe(true);
  });
});
