import type { ColorScheme } from '@/theme/colors';
import type { MoodKey, MoodTag } from '@/types';

export interface MoodMeta {
  key: MoodKey;
  label: string;
  emoji: string;
  /** Numeric score used for charts and averages (higher is better). */
  score: number;
  colorKey: keyof Pick<
    ColorScheme,
    'moodGreat' | 'moodGood' | 'moodOkay' | 'moodLow' | 'moodAwful'
  >;
}

export const MOODS: MoodMeta[] = [
  { key: 'great', label: 'Great', emoji: '😄', score: 5, colorKey: 'moodGreat' },
  { key: 'good', label: 'Good', emoji: '🙂', score: 4, colorKey: 'moodGood' },
  { key: 'okay', label: 'Okay', emoji: '😐', score: 3, colorKey: 'moodOkay' },
  { key: 'low', label: 'Low', emoji: '😔', score: 2, colorKey: 'moodLow' },
  { key: 'awful', label: 'Awful', emoji: '😣', score: 1, colorKey: 'moodAwful' },
];

export const MOOD_BY_KEY: Record<MoodKey, MoodMeta> = MOODS.reduce(
  (acc, m) => {
    acc[m.key] = m;
    return acc;
  },
  {} as Record<MoodKey, MoodMeta>,
);

export const MOOD_TAGS: { key: MoodTag; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'family', label: 'Family' },
  { key: 'health', label: 'Health' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'money', label: 'Money' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'loneliness', label: 'Loneliness' },
];
