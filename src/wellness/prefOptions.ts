import type { WellnessGoalChip, WellnessMoodChip } from '@/wellness/types';

export const WELLNESS_MOOD_OPTIONS: { id: WellnessMoodChip; label: string }[] = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
  { id: 'tired', label: 'Tired' },
  { id: 'lonely', label: 'Lonely' },
  { id: 'stressed', label: 'Stressed' },
  { id: 'calm', label: 'Calm' },
];

export const WELLNESS_GOAL_OPTIONS: { id: WellnessGoalChip; label: string }[] = [
  { id: 'better_sleep', label: 'Better sleep' },
  { id: 'reduce_stress', label: 'Reduce stress' },
  { id: 'daily_routine', label: 'Daily routine' },
  { id: 'anxiety', label: 'Ease anxiety' },
  { id: 'focus', label: 'Focus' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'positive_thinking', label: 'Positive thinking' },
];

export const WELLNESS_TIME_OPTIONS = [
  { minutes: 10 as const, hint: 'Quick reset' },
  { minutes: 15 as const, hint: 'Balanced' },
  { minutes: 20 as const, hint: 'Steady care' },
  { minutes: 30 as const, hint: 'Deeper focus' },
];

export const DEFAULT_WELLNESS_MINUTES = 15;

export function togglePrefValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function labelForMoods(moods: WellnessMoodChip[]): string {
  if (moods.length === 0) return 'Not set';
  const labels = moods
    .map((id) => WELLNESS_MOOD_OPTIONS.find((m) => m.id === id)?.label ?? id)
    .slice(0, 3);
  const extra = moods.length > 3 ? ` +${moods.length - 3}` : '';
  return `${labels.join(', ')}${extra}`;
}

export function labelForGoals(goals: WellnessGoalChip[]): string {
  if (goals.length === 0) return 'Not set';
  const labels = goals
    .map((id) => WELLNESS_GOAL_OPTIONS.find((g) => g.id === id)?.label ?? id)
    .slice(0, 2);
  const extra = goals.length > 2 ? ` +${goals.length - 2}` : '';
  return `${labels.join(', ')}${extra}`;
}
