import { createId } from '@/utils/id';
import {
  applyExclusions,
  applyForget,
  LOCAL_USER_ID,
  normalizeDraft,
} from '@/voice/reflectionMemory';
import type { ForgetResult, MoodMark, ReflectionDraftInput, ReflectionMemory } from '@/voice/types';

export interface DraftWrite extends ReflectionDraftInput {
  sessionId: string;
  toolCallId: string;
  demoSeed?: boolean;
  userApproved?: boolean;
  approvedMemories?: string[];
  id?: string;
  createdAt?: number;
}

export interface ApprovalPatch {
  summary: string;
  realization: string;
  commitments: string[];
  approvedMemories: string[];
  mood: string | null;
}

export interface VoiceMemoryStore {
  ensureSession(id: string): Promise<void>;
  appendTranscript(sessionId: string, role: 'user' | 'oppuna', text: string): Promise<void>;
  forgetConversation(sessionId: string): Promise<ForgetResult>;
  putReflectionDraft(input: DraftWrite): Promise<ReflectionMemory>;
  approveReflection(id: string, patch: ApprovalPatch): Promise<ReflectionMemory | null>;
  removeApprovedMemory(reflectionId: string, memory: string): Promise<ReflectionMemory | null>;
  listReflections(): Promise<ReflectionMemory[]>;
  recordStructuredMood(input: {
    sessionId: string | null;
    mood: string;
    intensity: number;
    note: string | null;
  }): Promise<void>;
  listMoods(): Promise<MoodMark[]>;
}

export function createReflectionRecord(input: DraftWrite): ReflectionMemory {
  const sanitized = applyExclusions(normalizeDraft(input));
  const approved = (input.approvedMemories ?? []).map((item) => item.trim()).filter(Boolean);
  return {
    ...sanitized,
    id: input.id ?? createId(),
    userId: LOCAL_USER_ID,
    sessionId: input.sessionId,
    createdAt: input.createdAt ?? Date.now(),
    approvedMemories: input.userApproved ? approved : [],
    userApproved: Boolean(input.userApproved),
    demoSeed: Boolean(input.demoSeed),
    toolCallId: input.toolCallId,
  };
}

/** Reference store used by tests and as the behavioral spec for SQLite. */
export function createMemoryStore(): VoiceMemoryStore & {
  transcripts: { id: string; sessionId: string; role: 'user' | 'oppuna'; text: string }[];
} {
  const sessions = new Set<string>();
  const transcripts: { id: string; sessionId: string; role: 'user' | 'oppuna'; text: string }[] = [];
  const reflections: ReflectionMemory[] = [];
  const moods: MoodMark[] = [];

  return {
    transcripts,
    async ensureSession(id: string) {
      sessions.add(id);
    },
    async appendTranscript(sessionId, role, text) {
      sessions.add(sessionId);
      transcripts.push({ id: createId(), sessionId, role, text });
    },
    async forgetConversation(sessionId) {
      const applied = applyForget(
        {
          transcripts: transcripts.map((row) => ({ id: row.id, sessionId: row.sessionId })),
          reflections: reflections.slice(),
        },
        sessionId,
      );
      transcripts.splice(
        0,
        transcripts.length,
        ...transcripts.filter((row) => applied.snapshot.transcripts.some((kept) => kept.id === row.id)),
      );
      const keptIds = new Set(applied.snapshot.reflections.map((row) => row.id));
      for (let i = reflections.length - 1; i >= 0; i -= 1) {
        if (!keptIds.has(reflections[i]!.id)) reflections.splice(i, 1);
      }
      return applied.result;
    },
    async putReflectionDraft(input) {
      if (input.toolCallId) {
        const byCall = reflections.find((row) => row.toolCallId === input.toolCallId);
        if (byCall) return byCall;
      }
      const open = reflections.find(
        (row) => row.sessionId === input.sessionId && !row.userApproved && !row.demoSeed,
      );
      const record = createReflectionRecord({
        ...input,
        id: open?.id ?? input.id,
        createdAt: open?.createdAt ?? input.createdAt,
      });
      if (open) {
        const index = reflections.findIndex((row) => row.id === open.id);
        reflections[index] = record;
        return record;
      }
      reflections.push(record);
      return record;
    },
    async approveReflection(id, patch) {
      const record = reflections.find((row) => row.id === id);
      if (!record) return null;
      if (record.userApproved) return record;
      record.summary = patch.summary.trim();
      record.realization = patch.realization.trim();
      record.commitments = patch.commitments.map((item) => item.trim()).filter(Boolean);
      record.approvedMemories = patch.approvedMemories.map((item) => item.trim()).filter(Boolean);
      record.mood = patch.mood;
      record.userApproved = true;
      return record;
    },
    async removeApprovedMemory(reflectionId, memory) {
      const record = reflections.find((row) => row.id === reflectionId);
      if (!record) return null;
      const needle = memory.trim().toLowerCase();
      record.approvedMemories = record.approvedMemories.filter((item) => item.trim().toLowerCase() !== needle);
      return record;
    },
    async listReflections() {
      return reflections.slice();
    },
    async recordStructuredMood(input) {
      moods.push({
        mood: input.mood,
        intensity: input.intensity,
        note: input.note,
        createdAt: Date.now(),
        sessionId: input.sessionId,
      });
    },
    async listMoods() {
      return moods.slice();
    },
  };
}
