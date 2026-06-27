import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { VoiceNote } from '@/types';

interface VoiceRow {
  id: string;
  uri: string;
  duration_sec: number;
  transcript: string | null;
  created_at: number;
}

function rowToNote(row: VoiceRow): VoiceNote {
  return {
    id: row.id,
    uri: row.uri,
    durationSec: row.duration_sec,
    transcript: row.transcript,
    createdAt: row.created_at,
  };
}

export interface CreateVoiceNoteInput {
  uri: string;
  durationSec: number;
  transcript?: string | null;
}

export const voiceNoteRepository = {
  async create(input: CreateVoiceNoteInput): Promise<VoiceNote> {
    const note: VoiceNote = {
      id: createId(),
      uri: input.uri,
      durationSec: input.durationSec,
      transcript: input.transcript ?? null,
      createdAt: Date.now(),
    };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO voice_notes (id, uri, duration_sec, transcript, created_at) VALUES (?, ?, ?, ?, ?)',
      [note.id, note.uri, note.durationSec, note.transcript, note.createdAt],
    );
    return note;
  },

  async list(limit = 100): Promise<VoiceNote[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<VoiceRow>(
      'SELECT * FROM voice_notes ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToNote);
  },

  async remove(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM voice_notes WHERE id = ?', [id]);
  },
};
