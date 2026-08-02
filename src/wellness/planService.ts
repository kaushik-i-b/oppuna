import { getCareStreak, recordCareActivity } from '@/services/careRetentionService';
import {
  localDateKey,
  wellnessPlanRepository,
} from '@/database/repositories/wellnessPlanRepository';
import { buildDraftPlan, careKindForPlanActivity } from '@/wellness/ruleEngine';
import { personalizeDraftPlan } from '@/wellness/planPersonalizer';
import type {
  WellnessGoalChip,
  WellnessMoodChip,
  WellnessPlan,
  WellnessPrefs,
} from '@/wellness/types';

function dateSeed(dateKey: string): number {
  return Number(dateKey.replace(/-/g, '')) || 0;
}

async function recentCompletionRate(): Promise<number> {
  const recent = await wellnessPlanRepository.getRecent(7);
  if (recent.length === 0) return 0.5;
  let total = 0;
  let done = 0;
  for (const plan of recent) {
    total += plan.activities.length;
    done += plan.completedIds.length;
  }
  if (total === 0) return 0.5;
  return done / total;
}

export async function getWellnessPrefs(): Promise<WellnessPrefs> {
  return wellnessPlanRepository.getPrefs();
}

export async function saveWellnessPrefs(input: {
  displayName?: string;
  moods?: WellnessMoodChip[];
  goals?: WellnessGoalChip[];
  availableMinutes?: number;
}): Promise<WellnessPrefs> {
  return wellnessPlanRepository.savePrefs(input);
}

export async function getTodayPlan(): Promise<WellnessPlan | null> {
  return wellnessPlanRepository.getByDate(localDateKey());
}

/**
 * Generate (or return existing) today's plan. Rule engine selects activities;
 * Qwen may personalize copy; invalid/unavailable LLM → static rule copy.
 */
export async function generateTodayPlan(options?: {
  force?: boolean;
  personalize?: boolean;
}): Promise<WellnessPlan> {
  const dateKey = localDateKey();
  if (!options?.force) {
    const existing = await wellnessPlanRepository.getByDate(dateKey);
    if (existing) return existing;
  }

  const prefs = await wellnessPlanRepository.getPrefs();
  const streak = await getCareStreak();
  const completionRate = await recentCompletionRate();

  let draft = buildDraftPlan({
    moods: prefs.moods,
    goals: prefs.goals,
    availableMinutes: prefs.availableMinutes,
    completionRate,
    streak: streak.currentStreak,
    seed: dateSeed(dateKey),
  });

  if (options?.personalize !== false) {
    draft = await personalizeDraftPlan(draft, prefs.displayName);
  }

  return wellnessPlanRepository.upsertPlan({
    dateKey,
    title: draft.title,
    encouragement: draft.encouragement,
    explanation: draft.explanation,
    estimatedMinutes: draft.estimatedMinutes,
    activities: draft.activities,
    completedIds: [],
    context: draft.context,
  });
}

export async function togglePlanActivity(activityId: string): Promise<WellnessPlan | null> {
  const plan = await getTodayPlan();
  if (!plan) return null;

  const isDone = plan.completedIds.includes(activityId);
  const completedIds = isDone
    ? plan.completedIds.filter((id) => id !== activityId)
    : [...plan.completedIds, activityId];

  const updated = await wellnessPlanRepository.setCompletedIds(plan.dateKey, completedIds);

  if (!isDone) {
    const activity = plan.activities.find((a) => a.id === activityId);
    if (activity) {
      const kind = careKindForPlanActivity(activity);
      if (kind) {
        await recordCareActivity(kind).catch(() => undefined);
      }
    }
  }

  return updated;
}

export async function completePlan(): Promise<WellnessPlan | null> {
  const plan = await getTodayPlan();
  if (!plan) return null;
  const completedIds = plan.activities.map((a) => a.id);
  const newlyCompleted = completedIds.filter((id) => !plan.completedIds.includes(id));
  const updated = await wellnessPlanRepository.setCompletedIds(plan.dateKey, completedIds);

  for (const id of newlyCompleted) {
    const activity = plan.activities.find((a) => a.id === id);
    if (!activity) continue;
    const kind = careKindForPlanActivity(activity);
    if (kind) {
      await recordCareActivity(kind).catch(() => undefined);
    }
  }

  await recordCareActivity('selfcare').catch(() => undefined);
  return updated;
}

export function planProgress(plan: WellnessPlan): {
  done: number;
  total: number;
  ratio: number;
  isComplete: boolean;
} {
  const total = plan.activities.length;
  const done = plan.completedIds.filter((id) => plan.activities.some((a) => a.id === id)).length;
  const ratio = total === 0 ? 0 : done / total;
  return { done, total, ratio, isComplete: total > 0 && done >= total };
}

/** Simple 0–100 wellness score from streak + plan progress + mood proxy in context. */
export function computeWellnessScore(input: {
  streak: number;
  plan: WellnessPlan | null;
  moodAverage?: number | null;
}): number {
  const streakScore = Math.min(40, input.streak * 5);
  const planScore = input.plan ? Math.round(planProgress(input.plan).ratio * 40) : 10;
  const moodScore =
    input.moodAverage == null ? 15 : Math.round(Math.max(0, Math.min(5, input.moodAverage)) * 4);
  return Math.max(0, Math.min(100, streakScore + planScore + moodScore));
}
