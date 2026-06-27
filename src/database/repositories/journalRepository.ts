import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { JournalEntry, JournalKind } from '@/types';

interface JournalRow {
  id: string;
  kind: string;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
}

/* ---- Pure helpers (unit-tested) ---- */

export function rowToJournal(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    kind: row.kind as JournalKind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function filterJournalEntries(
  entries: JournalEntry[],
  query: string,
  kind?: JournalKind | 'all',
): JournalEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesKind = !kind || kind === 'all' || entry.kind === kind;
    if (!matchesKind) return false;
    if (!q) return true;
    return (
      entry.title.toLowerCase().includes(q) || entry.body.toLowerCase().includes(q)
    );
  });
}

export function isJournalEntryValid(title: string, body: string): boolean {
  return title.trim().length > 0 || body.trim().length > 0;
}

/* ---- SQLite-backed operations ---- */

export interface CreateJournalInput {
  kind: JournalKind;
  title: string;
  body: string;
}

export const journalRepository = {
  async create(input: CreateJournalInput): Promise<JournalEntry> {
    const now = Date.now();
    const entry: JournalEntry = {
      id: createId(),
      kind: input.kind,
      title: input.title.trim(),
      body: input.body.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO journal_entries (id, kind, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.id, entry.kind, entry.title, entry.body, entry.createdAt, entry.updatedAt],
    );
    return entry;
  },

  async update(id: string, title: string, body: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE journal_entries SET title = ?, body = ?, updated_at = ? WHERE id = ?',
      [title.trim(), body.trim(), Date.now(), id],
    );
  },

  async list(limit = 500): Promise<JournalEntry[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<JournalRow>(
      'SELECT * FROM journal_entries ORDER BY updated_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToJournal);
  },

  async getById(id: string): Promise<JournalEntry | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<JournalRow>('SELECT * FROM journal_entries WHERE id = ?', [id]);
    return row ? rowToJournal(row) : null;
  },

  async remove(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  },

  async count(): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM journal_entries');
    return row?.c ?? 0;
  },
};
