import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import { createReflectionRecord, type ApprovalPatch, type DraftWrite, type VoiceMemoryStore } from '@/voice/memoryStore';
import { LOCAL_USER_ID } from '@/voice/reflectionMemory';
import type { ForgetResult, MoodMark, ReflectionMemory } from '@/voice/types';

interface ReflectionRow {
  id: string;
  user_id: string;
  session_id: string;
  created_at: number;
  summary: string;
  mood: string | null;
  themes_json: string;
  concerns_json: string;
  positive_moments_json: string;
  commitments_json: string;
  memory_candidates_json: string;
  approved_memories_json: string;
  excluded_topics_json: string;
  realization: string;
  user_approved: number;
  demo_seed: number;
  tool_call_id: string | null;
}

function readList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function rowToReflection(row: ReflectionRow): ReflectionMemory {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    createdAt: row.created_at,
    summary: row.summary,
    mood: row.mood,
    themes: readList(row.themes_json),
    concerns: readList(row.concerns_json),
    positiveMoments: readList(row.positive_moments_json),
    commitments: readList(row.commitments_json),
    memoryCandidates: readList(row.memory_candidates_json),
    approvedMemories: readList(row.approved_memories_json),
    excludedTopics: readList(row.excluded_topics_json),
    realization: row.realization,
    userApproved: row.user_approved === 1,
    demoSeed: row.demo_seed === 1,
    toolCallId: row.tool_call_id,
  };
}

async function readById(id: string): Promise<ReflectionMemory | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ReflectionRow>('SELECT * FROM reflection_memories WHERE id = ?', [id]);
  return row ? rowToReflection(row) : null;
}

async function upsert(record: ReflectionMemory): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO reflection_memories (
      id, user_id, session_id, created_at, summary, mood, themes_json, concerns_json,
      positive_moments_json, commitments_json, memory_candidates_json, approved_memories_json,
      excluded_topics_json, realization, user_approved, demo_seed, tool_call_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      summary = excluded.summary,
      mood = excluded.mood,
      themes_json = excluded.themes_json,
      concerns_json = excluded.concerns_json,
      positive_moments_json = excluded.positive_moments_json,
      commitments_json = excluded.commitments_json,
      memory_candidates_json = excluded.memory_candidates_json,
      approved_memories_json = excluded.approved_memories_json,
      excluded_topics_json = excluded.excluded_topics_json,
      realization = excluded.realization,
      user_approved = excluded.user_approved,
      demo_seed = excluded.demo_seed,
      tool_call_id = excluded.tool_call_id`,
    [
      record.id,
      record.userId || LOCAL_USER_ID,
      record.sessionId,
      record.createdAt,
      record.summary,
      record.mood,
      JSON.stringify(record.themes),
      JSON.stringify(record.concerns),
      JSON.stringify(record.positiveMoments),
      JSON.stringify(record.commitments),
      JSON.stringify(record.memoryCandidates),
      JSON.stringify(record.approvedMemories),
      JSON.stringify(record.excludedTopics),
      record.realization,
      record.userApproved ? 1 : 0,
      record.demoSeed ? 1 : 0,
      record.toolCallId,
    ],
  );
}

export const reflectionRepository: VoiceMemoryStore = {
  async ensureSession(id: string) {
    const db = getDatabase();
    await db.runAsync('INSERT OR IGNORE INTO voice_sessions (id, started_at) VALUES (?, ?)', [id, Date.now()]);
  },

  async appendTranscript(sessionId, role, text) {
    const db = getDatabase();
    await db.runAsync('INSERT OR IGNORE INTO voice_sessions (id, started_at) VALUES (?, ?)', [
      sessionId,
      Date.now(),
    ]);
    await db.runAsync(
      'INSERT INTO voice_transcripts (id, session_id, role, text, created_at) VALUES (?, ?, ?, ?, ?)',
      [createId(), sessionId, role, text, Date.now()],
    );
  },

  async forgetConversation(sessionId): Promise<ForgetResult> {
    const db = getDatabase();
    const transcriptCount = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM voice_transcripts WHERE session_id = ?',
      [sessionId],
    );
    const draftCount = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM reflection_memories WHERE session_id = ? AND user_approved = 0',
      [sessionId],
    );
    const approvedCount = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM reflection_memories WHERE user_approved = 1',
      [],
    );
    await db.runAsync('DELETE FROM voice_transcripts WHERE session_id = ?', [sessionId]);
    await db.runAsync('DELETE FROM reflection_memories WHERE session_id = ? AND user_approved = 0', [
      sessionId,
    ]);
    await db.runAsync('UPDATE voice_sessions SET forgotten = 1, ended_at = ? WHERE id = ?', [
      Date.now(),
      sessionId,
    ]);
    return {
      removedTranscripts: transcriptCount?.c ?? 0,
      removedUnsavedReflections: draftCount?.c ?? 0,
      keptApprovedReflections: approvedCount?.c ?? 0,
    };
  },

  async putReflectionDraft(input: DraftWrite) {
    const db = getDatabase();
    await db.runAsync('INSERT OR IGNORE INTO voice_sessions (id, started_at) VALUES (?, ?)', [
      input.sessionId,
      Date.now(),
    ]);
    if (input.toolCallId) {
      const byCall = await db.getFirstAsync<ReflectionRow>(
        'SELECT * FROM reflection_memories WHERE tool_call_id = ?',
        [input.toolCallId],
      );
      if (byCall) return rowToReflection(byCall);
    }
    const open = await db.getFirstAsync<ReflectionRow>(
      'SELECT * FROM reflection_memories WHERE session_id = ? AND user_approved = 0 AND demo_seed = 0 ORDER BY created_at DESC LIMIT 1',
      [input.sessionId],
    );
    const record = createReflectionRecord({
      ...input,
      id: open?.id ?? input.id,
      createdAt: open?.created_at ?? input.createdAt,
    });
    await upsert(record);
    return record;
  },

  async approveReflection(id: string, patch: ApprovalPatch) {
    const current = await readById(id);
    if (!current) return null;
    if (current.userApproved) return current;
    const next: ReflectionMemory = {
      ...current,
      summary: patch.summary.trim(),
      realization: patch.realization.trim(),
      commitments: patch.commitments.map((item) => item.trim()).filter(Boolean),
      approvedMemories: patch.approvedMemories.map((item) => item.trim()).filter(Boolean),
      mood: patch.mood,
      userApproved: true,
    };
    await upsert(next);
    return next;
  },

  async removeApprovedMemory(reflectionId: string, memory: string) {
    const current = await readById(reflectionId);
    if (!current) return null;
    const needle = memory.trim().toLowerCase();
    const next: ReflectionMemory = {
      ...current,
      approvedMemories: current.approvedMemories.filter((item) => item.trim().toLowerCase() !== needle),
    };
    await upsert(next);
    return next;
  },

  async listReflections() {
    const db = getDatabase();
    const rows = await db.getAllAsync<ReflectionRow>('SELECT * FROM reflection_memories ORDER BY created_at ASC');
    return rows.map(rowToReflection);
  },

  async recordStructuredMood(input) {
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO reflection_moods (id, session_id, mood, intensity, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [createId(), input.sessionId, input.mood, input.intensity, input.note, Date.now()],
    );
  },

  async listMoods(): Promise<MoodMark[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      mood: string;
      intensity: number;
      note: string | null;
      created_at: number;
      session_id: string | null;
    }>('SELECT mood, intensity, note, created_at, session_id FROM reflection_moods ORDER BY created_at ASC');
    return rows.map((row) => ({
      mood: row.mood,
      intensity: row.intensity,
      note: row.note,
      createdAt: row.created_at,
      sessionId: row.session_id,
    }));
  },
};
