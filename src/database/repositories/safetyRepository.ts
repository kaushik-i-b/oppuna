import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { SafetyCategory, SafetyEvent } from '@/types';

interface SafetyRow {
  id: string;
  category: string;
  created_at: number;
}

function rowToEvent(row: SafetyRow): SafetyEvent {
  return { id: row.id, category: row.category as SafetyCategory, createdAt: row.created_at };
}

export const safetyRepository = {
  /**
   * Records only that a safety category was triggered and when. The message
   * that triggered it is never stored.
   */
  async record(category: SafetyCategory): Promise<SafetyEvent> {
    const event: SafetyEvent = { id: createId(), category, createdAt: Date.now() };
    const db = getDatabase();
    await db.runAsync('INSERT INTO safety_events (id, category, created_at) VALUES (?, ?, ?)', [
      event.id,
      event.category,
      event.createdAt,
    ]);
    return event;
  },

  async list(limit = 100): Promise<SafetyEvent[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<SafetyRow>(
      'SELECT * FROM safety_events ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToEvent);
  },
};
