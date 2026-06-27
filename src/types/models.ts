/** Domain models. All data described here lives only on the device. */

export type MoodKey = 'great' | 'good' | 'okay' | 'low' | 'awful';

export type MoodTag =
  | 'work'
  | 'family'
  | 'health'
  | 'sleep'
  | 'money'
  | 'relationship'
  | 'loneliness';

export interface MoodEntry {
  id: string;
  mood: MoodKey;
  /** 1-10 self-reported intensity. */
  intensity: number;
  note: string | null;
  tags: MoodTag[];
  createdAt: number;
}

export type JournalKind =
  | 'daily'
  | 'gratitude'
  | 'thought_record'
  | 'trigger'
  | 'note';

export interface JournalEntry {
  id: string;
  kind: JournalKind;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  /** Mood/intent metadata captured at send time, for insights only. */
  intent: string | null;
  mood: MoodKey | null;
  createdAt: number;
}

export type BreathingPattern = 'four_four_six' | 'box' | 'calm_five';

export interface BreathingSession {
  id: string;
  pattern: BreathingPattern;
  /** Completed cycles. */
  cycles: number;
  /** Duration in seconds. */
  durationSec: number;
  completed: boolean;
  createdAt: number;
}

export type SafetyCategory =
  | 'suicide'
  | 'self_harm'
  | 'abuse'
  | 'violence'
  | 'medical_emergency'
  | 'panic_emergency';

/**
 * Only non-identifying metadata is stored for safety events: the category and
 * timestamp. The triggering message text is never persisted.
 */
export interface SafetyEvent {
  id: string;
  category: SafetyCategory;
  createdAt: number;
}

export interface VoiceNote {
  id: string;
  /** Local file URI inside the app sandbox. */
  uri: string;
  durationSec: number;
  transcript: string | null;
  createdAt: number;
}
