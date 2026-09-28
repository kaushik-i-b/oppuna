/** Voice session phases. Exactly one is active at a time. */
export type VoicePhase =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'SAVING'
  | 'ERROR';

export const VOICE_PHASES: readonly VoicePhase[] = [
  'IDLE',
  'CONNECTING',
  'LISTENING',
  'THINKING',
  'SPEAKING',
  'INTERRUPTED',
  'SAVING',
  'ERROR',
] as const;

export const PHASE_LABEL: Record<VoicePhase, string> = {
  IDLE: 'Ready',
  CONNECTING: 'Connecting…',
  LISTENING: 'Listening…',
  THINKING: 'Thinking…',
  SPEAKING: 'Speaking…',
  INTERRUPTED: 'Interrupted',
  SAVING: 'Saving…',
  ERROR: 'Something went wrong',
};

export type PatternPeriod = '7d' | '30d';

export interface ReflectionDraftInput {
  summary: string;
  mood: string | null;
  themes: string[];
  concerns: string[];
  positiveMoments: string[];
  commitments: string[];
  excludedTopics: string[];
  memoryCandidates: string[];
  realization: string;
}

export interface ReflectionMemory extends ReflectionDraftInput {
  id: string;
  userId: string;
  sessionId: string;
  createdAt: number;
  approvedMemories: string[];
  userApproved: boolean;
  demoSeed: boolean;
  toolCallId: string | null;
}

export interface MoodMark {
  mood: string;
  intensity: number;
  note: string | null;
  createdAt: number;
  sessionId: string | null;
}

export interface ApprovedMemorySnippet {
  reflectionId: string;
  createdAt: number;
  summary: string;
  mood: string | null;
  themes: string[];
  approvedMemories: string[];
  demoSeed: boolean;
}

export interface PatternTrend {
  label: string;
  detail: string;
}

export interface PatternReport {
  period: PatternPeriod;
  sufficient: boolean;
  reflectionCount: number;
  trends: PatternTrend[];
}

export interface ForgetResult {
  removedTranscripts: number;
  removedUnsavedReflections: number;
  keptApprovedReflections: number;
}

export type ToolEffect =
  | { type: 'reflection_draft'; reflection: ReflectionMemory }
  | { type: 'memories'; snippets: ApprovedMemorySnippet[] }
  | { type: 'mood_recorded'; mood: string; intensity: number }
  | { type: 'patterns'; report: PatternReport }
  | { type: 'none' };

export interface TranscriptLine {
  id: string;
  role: 'user' | 'oppuna';
  text: string;
  partial: boolean;
}
