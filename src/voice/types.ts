/**
 * Shared voice-domain types for "Talk to Oppuna".
 *
 * The voice feature keeps SESSION CONTEXT (ephemeral transcript + draft)
 * strictly separate from LONG-TERM APPROVED MEMORY (explicitly approved rows).
 */

export type VoiceState =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'SAVING'
  | 'ERROR';

export interface TranscriptSegment {
  id: string;
  speaker: 'USER' | 'OPPUNA';
  /** Final text. For partial USER segments this updates in place. */
  text: string;
  final: boolean;
  createdAt: number;
}

export interface MemoryCandidate {
  id: string;
  text: string;
  approved: boolean;
  edited: boolean;
}

export interface ReflectionDraft {
  summary: string;
  mood: string;
  themes: string[];
  concerns: string[];
  positiveMoments: string[];
  commitments: string[];
  /** Topics the user asked to exclude — stripped before anything is saved. */
  excludedTopics: string[];
  memoryCandidates: MemoryCandidate[];
}

export interface ApprovedMemory {
  id: string;
  text: string;
  createdAt: number;
}

export interface PersistedReflection {
  id: string;
  sessionId: string | null;
  summary: string;
  mood: string;
  themes: string[];
  concerns: string[];
  positiveMoments: string[];
  commitments: string[];
  excludedTopics: string[];
  userApproved: boolean;
  isDemo: boolean;
  createdAt: number;
}

/** Tool-call record used for idempotency (duplicate delivery protection). */
export interface VoiceToolCall {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
}

export const VOICE_STATE_LABEL: Record<VoiceState, string> = {
  IDLE: 'Tap to begin',
  CONNECTING: 'Connecting…',
  LISTENING: 'Listening…',
  THINKING: 'Thinking…',
  SPEAKING: 'Speaking…',
  INTERRUPTED: 'Listening…',
  SAVING: 'Saving…',
  ERROR: 'Something went wrong',
};
