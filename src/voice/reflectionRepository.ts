/**
 * SQLite persistence for voice reflections + user-controlled memory.
 *
 * Model:
 * - `voice_sessions` holds the ephemeral session transcript (SESSION CONTEXT).
 * - `reflections` holds the structured, user-approved summary.
 * - `reflection_memories` holds individual memory items; ONLY rows with
 *   `approved = 1` are ever returned to future conversations.
 *
 * "Forget this conversation" deletes the session transcript, any reflection
 * created from that session that the user never approved, and pending
 * (unapproved) candidates — but never previously approved unrelated memories.
 */

import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { ApprovedMemory, PersistedReflection } from '@/voice/types';

export interface ReflectionRow {
  id: string;
  session_id: string | null;
  summary: string;
  mood: string;
  themes_json: string;
  concerns_json: string;
  positive_moments_json: string;
  commitments_json: string;
  excluded_topics_json: string;
  user_approved: number;
  is_demo: number;
  created_at: number;
}

export interface MemoryRow {
  id: string;
  reflection_id: string;
  text: string;
  approved: number;
  created_at: number;
  updated_at: number;
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToReflection(row: ReflectionRow): PersistedReflection {
  return {
    id: row.id,
    sessionId: row.session_id,
    summary: row.summary,
    mood: row.mood,
    themes: parseJsonArray(row.themes_json),
    concerns: parseJsonArray(row.concerns_json),
    positiveMoments: parseJsonArray(row.positive_moments_json),
    commitments: parseJsonArray(row.commitments_json),
    excludedTopics: parseJsonArray(row.excluded_topics_json),
    userApproved: row.user_approved === 1,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
  };
}

export interface CreateReflectionInput {
  sessionId?: string | null;
  summary: string;
  mood?: string;
  themes?: string[];
  concerns?: string[];
  positiveMoments?: string[];
  commitments?: string[];
  excludedTopics?: string[];
  /** Memory candidates start UNAPPROVED; approval is a separate explicit act. */
  memoryCandidates?: string[];
  isDemo?: boolean;
}

/**
 * Remove any sentence that mentions an excluded topic (case-insensitive
 * substring match per sentence). Pure + unit-tested.
 */
export function applyExcludedTopics(summary: string, excludedTopics: string[]): string {
  const topics = excludedTopics.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (topics.length === 0) return summary;
  const sentences = summary.match(/[^.!?]+[.!?]+["']?|\S[^.!?]*$/g) ?? [summary];
  const kept = sentences.filter(
    (sentence) => !topics.some((topic) => sentence.toLowerCase().includes(topic)),
  );
  return kept.join(' ').trim();
}

export const reflectionRepository = {
  async createVoiceSession(): Promise<string> {
    const db = getDatabase();
    const id = createId();
    await db.runAsync(
      'INSERT INTO voice_sessions (id, created_at, transcript_json, status) VALUES (?, ?, ?, ?)',
      [id, Date.now(), '[]', 'active'],
    );
    return id;
  },

  async saveSessionTranscript(sessionId: string, transcriptJson: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE voice_sessions SET transcript_json = ? WHERE id = ?', [
      transcriptJson,
      sessionId,
    ]);
  },

  async endVoiceSession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE voice_sessions SET ended_at = ?, status = ? WHERE id = ?', [
      Date.now(),
      'ended',
      sessionId,
    ]);
  },

  async createReflection(input: CreateReflectionInput): Promise<PersistedReflection> {
    const db = getDatabase();
    const now = Date.now();
    const summary = applyExcludedTopics(input.summary.trim(), input.excludedTopics ?? []);
    const row: ReflectionRow = {
      id: createId(),
      session_id: input.sessionId ?? null,
      summary,
      mood: (input.mood ?? '').trim(),
      themes_json: JSON.stringify(input.themes ?? []),
      concerns_json: JSON.stringify(input.concerns ?? []),
      positive_moments_json: JSON.stringify(input.positiveMoments ?? []),
      commitments_json: JSON.stringify(input.commitments ?? []),
      excluded_topics_json: JSON.stringify(input.excludedTopics ?? []),
      user_approved: 0,
      is_demo: input.isDemo ? 1 : 0,
      created_at: now,
    };
    await db.runAsync(
      'INSERT INTO reflections (id, session_id, summary, mood, themes_json, concerns_json, positive_moments_json, commitments_json, excluded_topics_json, user_approved, is_demo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        row.id,
        row.session_id,
        row.summary,
        row.mood,
        row.themes_json,
        row.concerns_json,
        row.positive_moments_json,
        row.commitments_json,
        row.excluded_topics_json,
        row.user_approved,
        row.is_demo,
        row.created_at,
      ],
    );
    for (const text of input.memoryCandidates ?? []) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      await db.runAsync(
        'INSERT INTO reflection_memories (id, reflection_id, text, approved, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [createId(), row.id, trimmed, 0, now, now],
      );
    }
    return rowToReflection(row);
  },

  async approveReflection(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE reflections SET user_approved = 1 WHERE id = ?', [id]);
  },

  async listMemories(reflectionId: string): Promise<MemoryRow[]> {
    const db = getDatabase();
    return db.getAllAsync<MemoryRow>(
      'SELECT * FROM reflection_memories WHERE reflection_id = ? ORDER BY created_at ASC',
      [reflectionId],
    );
  },

  async setMemoryApproval(memoryId: string, approved: boolean): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE reflection_memories SET approved = ?, updated_at = ? WHERE id = ?', [
      approved ? 1 : 0,
      Date.now(),
      memoryId,
    ]);
  },

  async updateMemoryText(memoryId: string, text: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE reflection_memories SET text = ?, updated_at = ? WHERE id = ?', [
      text.trim(),
      Date.now(),
      memoryId,
    ]);
  },

  async removeMemory(memoryId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM reflection_memories WHERE id = ?', [memoryId]);
  },

  async listRecentReflections(limit = 10, includeDemo = false): Promise<PersistedReflection[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<ReflectionRow>(
      includeDemo
        ? 'SELECT * FROM reflections ORDER BY created_at DESC LIMIT ?'
        : 'SELECT * FROM reflections WHERE is_demo = 0 ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToReflection);
  },

  /**
   * Retrieve ONLY approved memory texts for future conversation context.
   * Rejected/unapproved candidates are never returned. Optional keyword
   * relevance filter keeps context small and on-topic.
   */
  async getApprovedMemories(limit = 8, relevantTo?: string): Promise<ApprovedMemory[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<MemoryRow>(
      'SELECT * FROM reflection_memories WHERE approved = 1 ORDER BY updated_at DESC LIMIT ?',
      [Math.max(limit * 3, limit)],
    );
    let approved: ApprovedMemory[] = rows
      .filter((r) => (r.text ?? '').trim().length > 0)
      .map((r) => ({ id: r.id, text: r.text.trim(), createdAt: r.updated_at }));
    if (relevantTo && relevantTo.trim()) {
      const keywords = relevantTo
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((w) => w.length > 3);
      if (keywords.length > 0) {
        const scored = approved.map((m) => ({
          memory: m,
          score: keywords.filter((k) => m.text.toLowerCase().includes(k)).length,
        }));
        const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
        if (matched.length > 0) approved = matched.map((s) => s.memory);
      }
    }
    return approved.slice(0, limit);
  },

  /**
   * Forget the current conversation: remove the session transcript, any
   * reflection minted from this session that was never user-approved, and
   * unapproved candidates of approved session reflections. Previously
   * approved unrelated memories are ALWAYS preserved.
   */
  async forgetSession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM voice_sessions WHERE id = ?', [sessionId]);
    const unapproved = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM reflections WHERE session_id = ? AND user_approved = 0',
      [sessionId],
    );
    for (const row of unapproved) {
      await db.runAsync('DELETE FROM reflection_memories WHERE reflection_id = ?', [row.id]);
      await db.runAsync('DELETE FROM reflections WHERE id = ?', [row.id]);
    }
    // Drop unapproved candidates attached to an approved session reflection too.
    const approved = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM reflections WHERE session_id = ? AND user_approved = 1',
      [sessionId],
    );
    for (const row of approved) {
      await db.runAsync(
        'DELETE FROM reflection_memories WHERE reflection_id = ? AND approved = 0',
        [row.id],
      );
      await db.runAsync('UPDATE reflections SET session_id = NULL WHERE id = ?', [row.id]);
    }
  },

  async removeReflection(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM reflection_memories WHERE reflection_id = ?', [id]);
    await db.runAsync('DELETE FROM reflections WHERE id = ?', [id]);
  },

  async clearDemoData(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM reflection_memories WHERE reflection_id IN (SELECT id FROM reflections WHERE is_demo = 1)', []);
    await db.runAsync('DELETE FROM reflections WHERE is_demo = 1', []);
  },
};

export interface ReflectionPatterns {
  period: '7d' | '30d';
  reflectionCount: number;
  topThemes: { theme: string; count: number }[];
  topConcerns: { concern: string; count: number }[];
  moodTrend: 'rising' | 'falling' | 'steady' | 'insufficient';
  summary: string;
}

/**
 * Derive patterns from REAL stored reflections only. Returns honest
 * "insufficient data" results instead of fabricating trends. Pure over the
 * input list so it is unit-testable without SQLite.
 */
export function computeReflectionPatterns(
  reflections: PersistedReflection[],
  period: '7d' | '30d',
  now = Date.now(),
): ReflectionPatterns {
  const windowMs = (period === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
  const inWindow = reflections.filter((r) => !r.isDemo && now - r.createdAt <= windowMs);
  const count = (values: string[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (const value of values) {
      const key = value.trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };
  const topOf = (map: Map<string, number>, limit = 4) =>
    [...map.entries()]
      .map(([name, total]) => ({ name, count: total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  const themeCounts = topOf(count(inWindow.flatMap((r) => r.themes)));
  const concernCounts = topOf(count(inWindow.flatMap((r) => r.concerns)));

  // Mood trend: compare average mood-key score of first vs second half.
  // We only know free-text moods here, so map a small set of common words.
  const MOOD_SCORE: Record<string, number> = {
    great: 5, good: 4, okay: 3, ok: 3, low: 2, bad: 2, rough: 2, stressed: 2, exhausted: 2,
    calm: 4, hopeful: 4, anxious: 2, sad: 2, tired: 2, heavy: 2, lighter: 4, better: 4,
  };
  const scored = inWindow
    .map((r) => ({ at: r.createdAt, score: MOOD_SCORE[r.mood.trim().toLowerCase()] }))
    .filter((s): s is { at: number; score: number } => typeof s.score === 'number')
    .sort((a, b) => a.at - b.at);
  let moodTrend: ReflectionPatterns['moodTrend'] = 'insufficient';
  if (scored.length >= 3) {
    const mid = Math.floor(scored.length / 2);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const first = avg(scored.slice(0, mid).map((s) => s.score));
    const second = avg(scored.slice(mid).map((s) => s.score));
    moodTrend = second - first >= 0.5 ? 'rising' : first - second >= 0.5 ? 'falling' : 'steady';
  }
  const summary =
    inWindow.length === 0
      ? 'Not enough reflections yet — patterns will appear after a few saved reflections.'
      : `${inWindow.length} reflection${inWindow.length === 1 ? '' : 's'} in the last ${
          period === '7d' ? '7 days' : '30 days'
        }.`;
  return {
    period,
    reflectionCount: inWindow.length,
    topThemes: themeCounts.map((t) => ({ theme: t.name, count: t.count })),
    topConcerns: concernCounts.map((t) => ({ concern: t.name, count: t.count })),
    moodTrend,
    summary,
  };
}
