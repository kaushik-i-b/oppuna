import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { BreathingPattern, BreathingSession } from '@/types';

interface BreathingRow {
  id: string;
  pattern: string;
  cycles: number;
  duration_sec: number;
  completed: number;
  created_at: number;
}

function rowToSession(row: BreathingRow): BreathingSession {
  return {
    id: row.id,
    pattern: row.pattern as BreathingPattern,
    cycles: row.cycles,
    durationSec: row.duration_sec,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export interface CreateBreathingInput {
  pattern: BreathingPattern;
  cycles: number;
  durationSec: number;
  completed: boolean;
}

export const breathingRepository = {
  async create(input: CreateBreathingInput): Promise<BreathingSession> {
    const session: BreathingSession = {
      id: createId(),
      pattern: input.pattern,
      cycles: input.cycles,
      durationSec: input.durationSec,
      completed: input.completed,
      createdAt: Date.now(),
    };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO breathing_sessions (id, pattern, cycles, duration_sec, completed, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [session.id, session.pattern, session.cycles, session.durationSec, session.completed ? 1 : 0, session.createdAt],
    );
    return session;
  },

  async list(limit = 100): Promise<BreathingSession[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<BreathingRow>(
      'SELECT * FROM breathing_sessions ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToSession);
  },

  async count(): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM breathing_sessions WHERE completed = 1',
    );
    return row?.c ?? 0;
  },
};
