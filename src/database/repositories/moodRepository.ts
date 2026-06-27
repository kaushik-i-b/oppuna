import { getDatabase } from '@/database/client';
import { MOOD_BY_KEY } from '@/constants/moods';
import { createId } from '@/utils/id';
import { startOfDay } from '@/utils/date';
import type { MoodEntry, MoodKey, MoodTag } from '@/types';

interface MoodRow {
  id: string;
  mood: string;
  intensity: number;
  note: string | null;
  tags: string;
  created_at: number;
}

/* ---- Pure helpers (unit-tested) ---- */

export function serializeTags(tags: MoodTag[]): string {
  return JSON.stringify(tags);
}

export function deserializeTags(raw: string): MoodTag[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MoodTag[]) : [];
  } catch {
    return [];
  }
}

export function clampIntensity(value: number): number {
  if (Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(10, Math.round(value)));
}

export function rowToMood(row: MoodRow): MoodEntry {
  return {
    id: row.id,
    mood: row.mood as MoodKey,
    intensity: row.intensity,
    note: row.note,
    tags: deserializeTags(row.tags),
    createdAt: row.created_at,
  };
}

export interface WeeklyInsight {
  /** Average mood score (1-5) across the period, or null if no data. */
  averageScore: number | null;
  entryCount: number;
  /** Per-day average score, oldest first; null where there is no entry. */
  dailyScores: { day: number; score: number | null }[];
  topTags: { tag: MoodTag; count: number }[];
}

export function computeWeeklyInsights(entries: MoodEntry[], now = Date.now()): WeeklyInsight {
  const today = startOfDay(now);
  const days: number[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    days.push(today - i * 24 * 60 * 60 * 1000);
  }

  const within = entries.filter((e) => e.createdAt >= (days[0] ?? today));

  const dailyScores = days.map((day) => {
    const next = day + 24 * 60 * 60 * 1000;
    const dayEntries = within.filter((e) => e.createdAt >= day && e.createdAt < next);
    if (dayEntries.length === 0) return { day, score: null };
    const avg =
      dayEntries.reduce((sum, e) => sum + MOOD_BY_KEY[e.mood].score, 0) / dayEntries.length;
    return { day, score: Number(avg.toFixed(2)) };
  });

  const averageScore =
    within.length === 0
      ? null
      : Number(
          (within.reduce((sum, e) => sum + MOOD_BY_KEY[e.mood].score, 0) / within.length).toFixed(2),
        );

  const tagCounts = new Map<MoodTag, number>();
  for (const entry of within) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return { averageScore, entryCount: within.length, dailyScores, topTags };
}

/* ---- SQLite-backed operations ---- */

export interface CreateMoodInput {
  mood: MoodKey;
  intensity: number;
  note?: string | null;
  tags?: MoodTag[];
}

export const moodRepository = {
  async create(input: CreateMoodInput): Promise<MoodEntry> {
    const entry: MoodEntry = {
      id: createId(),
      mood: input.mood,
      intensity: clampIntensity(input.intensity),
      note: input.note?.trim() ? input.note.trim() : null,
      tags: input.tags ?? [],
      createdAt: Date.now(),
    };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO mood_entries (id, mood, intensity, note, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.id, entry.mood, entry.intensity, entry.note, serializeTags(entry.tags), entry.createdAt],
    );
    return entry;
  },

  async list(limit = 200): Promise<MoodEntry[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<MoodRow>(
      'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToMood);
  },

  async remove(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM mood_entries WHERE id = ?', [id]);
  },

  async count(): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM mood_entries');
    return row?.c ?? 0;
  },
};
