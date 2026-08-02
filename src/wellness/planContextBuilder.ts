import type { WellnessPlanContext, WellnessPlanActivity } from '@/wellness/types';

/**
 * Compact structured context for Qwen personalization (< ~400 tokens).
 * Never send raw DB rows — only this payload.
 */
export function buildPlanPersonalizationContext(input: {
  context: WellnessPlanContext;
  activities: WellnessPlanActivity[];
  displayName?: string;
}): string {
  const { context, activities, displayName } = input;
  const payload = {
    name: displayName?.trim() || undefined,
    moods: context.moods,
    goals: context.goals,
    minutes: context.availableMinutes,
    streak: context.streak,
    completionRate: Number(context.completionRate.toFixed(2)),
    activities: activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      duration: a.duration,
      category: a.category,
    })),
  };
  return JSON.stringify(payload);
}

export const PLAN_PERSONALIZER_SYSTEM = `You personalize a daily wellness plan. Reply with ONLY valid JSON, no markdown.
Schema:
{"title":string,"encouragement":string,"explanation":string,"activities":[{"id":string,"title":string,"description":string}]}
Rules:
- Keep the same activity ids; do not add/remove activities.
- Warm, brief, non-clinical. No diagnosis or medication advice.
- English. title <= 8 words. encouragement <= 2 sentences.
- explanation: one short paragraph why this plan fits moods/goals.`;
