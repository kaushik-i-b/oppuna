import type { MoodKey } from '@/types';

/** Maps a spoken mood onto the existing mood tracker scale. */
export function moodKeyForVoice(mood: string): MoodKey | null {
  switch (mood.trim().toLowerCase()) {
    case 'great':
      return 'great';
    case 'good':
    case 'calm':
      return 'good';
    case 'okay':
    case 'tired':
      return 'okay';
    case 'low':
    case 'stressed':
    case 'anxious':
    case 'frustrated':
    case 'frustration':
    case 'exhausted':
    case 'exhausting':
      return 'low';
    case 'awful':
      return 'awful';
    default:
      return null;
  }
}
