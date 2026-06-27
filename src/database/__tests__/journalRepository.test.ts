import {
  filterJournalEntries,
  isJournalEntryValid,
  rowToJournal,
} from '@/database/repositories/journalRepository';
import type { JournalEntry } from '@/types';

function makeEntry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: Math.random().toString(),
    kind: 'daily',
    title: '',
    body: '',
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  };
}

describe('journal storage helpers', () => {
  it('maps a database row to a journal entry', () => {
    const entry = rowToJournal({
      id: 'j1',
      kind: 'gratitude',
      title: 'Thanks',
      body: 'Grateful for tea',
      created_at: 1,
      updated_at: 2,
    });
    expect(entry).toEqual({
      id: 'j1',
      kind: 'gratitude',
      title: 'Thanks',
      body: 'Grateful for tea',
      createdAt: 1,
      updatedAt: 2,
    });
  });

  it('validates that an entry has a title or body', () => {
    expect(isJournalEntryValid('', '')).toBe(false);
    expect(isJournalEntryValid('   ', '   ')).toBe(false);
    expect(isJournalEntryValid('Title', '')).toBe(true);
    expect(isJournalEntryValid('', 'Some thoughts')).toBe(true);
  });
});

describe('filterJournalEntries', () => {
  const entries = [
    makeEntry({ kind: 'daily', title: 'Morning pages', body: 'A calm start' }),
    makeEntry({ kind: 'gratitude', title: 'Grateful', body: 'For sunshine' }),
    makeEntry({ kind: 'note', title: 'Reminder', body: 'Call a friend' }),
  ];

  it('returns all entries with empty query and "all" kind', () => {
    expect(filterJournalEntries(entries, '', 'all')).toHaveLength(3);
  });

  it('filters by kind', () => {
    const result = filterJournalEntries(entries, '', 'gratitude');
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('gratitude');
  });

  it('filters by case-insensitive text in title or body', () => {
    expect(filterJournalEntries(entries, 'SUNSHINE')).toHaveLength(1);
    expect(filterJournalEntries(entries, 'call')).toHaveLength(1);
    expect(filterJournalEntries(entries, 'nonexistent')).toHaveLength(0);
  });
});
