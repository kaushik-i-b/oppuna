import { WELLNESS_ACTIVITY_LIBRARY } from '@/wellness/activityLibrary';
import type {
  WellnessActivity,
  WellnessGoalChip,
  WellnessMoodChip,
  WellnessPlanActivity,
  WellnessPlanContext,
} from '@/wellness/types';

const GOAL_TAGS: Record<WellnessGoalChip, string[]> = {
  better_sleep: ['better_sleep', 'sleep', 'tired'],
  reduce_stress: ['reduce_stress', 'stressed', 'calm'],
  daily_routine: ['daily_routine', 'hydration', 'walking'],
  anxiety: ['anxiety', 'anxious', 'mindfulness', 'breathing'],
  focus: ['focus', 'productivity'],
  productivity: ['productivity', 'focus'],
  mindfulness: ['mindfulness', 'meditation', 'calm'],
  positive_thinking: ['positive_thinking', 'gratitude', 'reflection'],
};

const MOOD_TAGS: Record<WellnessMoodChip, string[]> = {
  happy: ['happy', 'gratitude', 'positive_thinking'],
  sad: ['sad', 'lonely', 'gratitude', 'self_care', 'reflection'],
  anxious: ['anxiety', 'anxious', 'breathing', 'mindfulness'],
  overwhelmed: ['overwhelmed', 'reduce_stress', 'breathing', 'mindfulness'],
  tired: ['tired', 'sleep', 'better_sleep', 'hydration'],
  lonely: ['lonely', 'self_care', 'gratitude', 'walking'],
  stressed: ['stressed', 'reduce_stress', 'breathing', 'digital_detox'],
  calm: ['calm', 'mindfulness', 'meditation'],
};

export interface DraftPlan {
  activities: WellnessPlanActivity[];
  estimatedMinutes: number;
  title: string;
  encouragement: string;
  explanation: string;
  context: WellnessPlanContext;
}

function scoreActivity(
  activity: WellnessActivity,
  moods: WellnessMoodChip[],
  goals: WellnessGoalChip[],
  preferredTags: Set<string>,
): number {
  let score = 0;
  for (const tag of activity.tags) {
    if (preferredTags.has(tag)) score += 3;
  }
  for (const mood of moods) {
    const moodTags = MOOD_TAGS[mood] ?? [];
    if (activity.tags.some((t) => moodTags.includes(t))) score += 2;
  }
  for (const goal of goals) {
    const goalTags = GOAL_TAGS[goal] ?? [];
    if (activity.tags.some((t) => goalTags.includes(t))) score += 2;
  }
  // Prefer shorter items when minutes are tight (handled by caller filter).
  score += Math.max(0, 4 - activity.difficulty);
  return score;
}

function toPlanActivity(activity: WellnessActivity, index: number): WellnessPlanActivity {
  return {
    id: `plan-act-${activity.id}-${index}`,
    libraryId: activity.id,
    title: activity.title,
    description: activity.description,
    duration: activity.durationMin,
    deepLink: activity.deepLink,
    category: activity.category,
  };
}

function buildPreferredTags(moods: WellnessMoodChip[], goals: WellnessGoalChip[]): Set<string> {
  const tags = new Set<string>();
  for (const mood of moods) {
    for (const t of MOOD_TAGS[mood] ?? []) tags.add(t);
  }
  for (const goal of goals) {
    for (const t of GOAL_TAGS[goal] ?? []) tags.add(t);
  }
  return tags;
}

function staticCopy(moods: WellnessMoodChip[], goals: WellnessGoalChip[], minutes: number): {
  title: string;
  encouragement: string;
  explanation: string;
} {
  const moodPart = moods.length ? moods.slice(0, 2).join(' & ') : 'today';
  const goalPart = goals.length ? goals[0]?.replace(/_/g, ' ') : 'feeling steadier';
  return {
    title: 'Your wellness plan',
    encouragement: `A gentle plan for feeling ${moodPart} — one small step at a time.`,
    explanation: `Chosen for about ${minutes} minutes, aimed at ${goalPart}. Activities match how you said you feel and what you want to work on.`,
  };
}

/**
 * Deterministic activity selection. Qwen only rewrites titles/copy later.
 */
export function buildDraftPlan(input: {
  moods: WellnessMoodChip[];
  goals: WellnessGoalChip[];
  availableMinutes: number;
  completionRate?: number;
  streak?: number;
  seed?: number;
}): DraftPlan {
  const availableMinutes = Math.max(5, Math.min(60, input.availableMinutes || 15));
  const moods = input.moods.length ? input.moods : (['calm'] as WellnessMoodChip[]);
  const goals = input.goals.length ? input.goals : (['daily_routine'] as WellnessGoalChip[]);
  const completionRate = input.completionRate ?? 0.5;
  const streak = input.streak ?? 0;
  const preferredTags = buildPreferredTags(moods, goals);

  // Lower completion → fewer / easier items; high completion → slightly more challenge.
  const targetCount =
    completionRate < 0.35 ? 2 : completionRate < 0.7 ? 3 : Math.min(4, Math.ceil(availableMinutes / 8));
  const maxDifficulty: 1 | 2 | 3 = completionRate < 0.4 ? 2 : 3;

  const candidates = WELLNESS_ACTIVITY_LIBRARY.filter(
    (a) => a.durationMin <= availableMinutes && a.difficulty <= maxDifficulty,
  );

  const scored = candidates
    .map((activity) => ({
      activity,
      score:
        scoreActivity(activity, moods, goals, preferredTags) +
        // Stable tie-break from seed/date so the same day is reproducible.
        ((hashId(activity.id) + (input.seed ?? 0)) % 7) * 0.01,
    }))
    .sort((a, b) => b.score - a.score);

  const picked: WellnessActivity[] = [];
  let usedMinutes = 0;
  const usedCategories = new Set<string>();

  for (const { activity } of scored) {
    if (picked.length >= targetCount) break;
    if (usedMinutes + activity.durationMin > availableMinutes) continue;
    // Prefer category diversity.
    if (usedCategories.has(activity.category) && picked.length < targetCount - 1) {
      // Allow later if we still need fillers.
      continue;
    }
    picked.push(activity);
    usedMinutes += activity.durationMin;
    usedCategories.add(activity.category);
  }

  // Second pass without category constraint if under-filled.
  if (picked.length < Math.min(2, targetCount)) {
    for (const { activity } of scored) {
      if (picked.some((p) => p.id === activity.id)) continue;
      if (picked.length >= targetCount) break;
      if (usedMinutes + activity.durationMin > availableMinutes) continue;
      picked.push(activity);
      usedMinutes += activity.durationMin;
    }
  }

  // Absolute fallback: shortest easy activities.
  if (picked.length === 0) {
    const fallback = [...WELLNESS_ACTIVITY_LIBRARY]
      .sort((a, b) => a.durationMin - b.durationMin)
      .slice(0, 2);
    picked.push(...fallback);
    usedMinutes = fallback.reduce((s, a) => s + a.durationMin, 0);
  }

  const activities = picked.map(toPlanActivity);
  const copy = staticCopy(moods, goals, availableMinutes);
  const context: WellnessPlanContext = {
    moods,
    goals,
    availableMinutes,
    completionRate,
    streak,
  };

  return {
    activities,
    estimatedMinutes: usedMinutes || availableMinutes,
    title: copy.title,
    encouragement: copy.encouragement,
    explanation: copy.explanation,
    context,
  };
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Map plan activity category/deepLink → care retention kind when possible. */
export function careKindForPlanActivity(activity: WellnessPlanActivity):
  | 'breathing'
  | 'grounding'
  | 'sleep'
  | 'journal'
  | 'selfcare'
  | 'reflection'
  | null {
  if (activity.deepLink === 'breathe') return 'breathing';
  if (activity.deepLink === 'ground') return 'grounding';
  if (activity.deepLink === 'sleep') return 'sleep';
  if (activity.deepLink === 'journal') return 'journal';
  if (activity.category === 'reflection' || activity.category === 'gratitude') return 'reflection';
  if (
    activity.category === 'self_care' ||
    activity.category === 'walking' ||
    activity.category === 'stretching' ||
    activity.category === 'hydration' ||
    activity.category === 'digital_detox' ||
    activity.category === 'focus' ||
    activity.category === 'meditation' ||
    activity.category === 'mindfulness'
  ) {
    return 'selfcare';
  }
  return null;
}
