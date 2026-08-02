/** Wellness domain types — daily plans, prefs, activity library. */

export type WellnessMoodChip =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'overwhelmed'
  | 'tired'
  | 'lonely'
  | 'stressed'
  | 'calm';

export type WellnessGoalChip =
  | 'better_sleep'
  | 'reduce_stress'
  | 'daily_routine'
  | 'anxiety'
  | 'focus'
  | 'productivity'
  | 'mindfulness'
  | 'positive_thinking';

export type WellnessActivityCategory =
  | 'breathing'
  | 'meditation'
  | 'walking'
  | 'stretching'
  | 'hydration'
  | 'gratitude'
  | 'reflection'
  | 'journaling'
  | 'sleep'
  | 'digital_detox'
  | 'self_care'
  | 'focus'
  | 'mindfulness';

export type WellnessDeepLink =
  | 'breathe'
  | 'ground'
  | 'sleep'
  | 'journal'
  | 'mood'
  | 'none';

export type WellnessDifficulty = 1 | 2 | 3;

export interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  category: WellnessActivityCategory;
  durationMin: number;
  difficulty: WellnessDifficulty;
  /** Goal/mood tags used by the rule engine. */
  tags: string[];
  deepLink: WellnessDeepLink;
}

export interface WellnessPlanActivity {
  id: string;
  libraryId: string;
  title: string;
  description: string;
  duration: number;
  deepLink: WellnessDeepLink;
  category: WellnessActivityCategory;
}

export interface WellnessPlan {
  id: string;
  dateKey: string;
  title: string;
  encouragement: string;
  explanation: string;
  estimatedMinutes: number;
  activities: WellnessPlanActivity[];
  completedIds: string[];
  context: WellnessPlanContext;
  createdAt: number;
}

export interface WellnessPlanContext {
  moods: WellnessMoodChip[];
  goals: WellnessGoalChip[];
  availableMinutes: number;
  completionRate: number;
  streak: number;
}

export interface WellnessPrefs {
  displayName: string;
  moods: WellnessMoodChip[];
  goals: WellnessGoalChip[];
  availableMinutes: number;
  updatedAt: number;
}

/** Extension point — always false until premium ships. */
export function isPremiumFeatureEnabled(_feature?: string): boolean {
  return false;
}
