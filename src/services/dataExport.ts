import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { APP } from '@/constants/app';
import {
  breathingRepository,
  chatRepository,
  journalRepository,
  moodRepository,
  safetyRepository,
  voiceNoteRepository,
  wipeAllTables,
} from '@/database';
import { logger } from '@/utils/logger';
import { ok, err } from '@/types';
import type { Result } from '@/types';

export interface ExportBundle {
  app: string;
  version: string;
  exportedAt: number;
  data: {
    moods: unknown[];
    journal: unknown[];
    sessions: unknown[];
    messages: unknown[];
    breathing: unknown[];
    safetyEvents: unknown[];
    voiceNotes: unknown[];
  };
}

async function buildBundle(): Promise<ExportBundle> {
  const sessions = await chatRepository.listSessions();
  const messages: unknown[] = [];
  for (const session of sessions) {
    messages.push(...(await chatRepository.listMessages(session.id)));
  }

  return {
    app: APP.name,
    version: APP.version,
    exportedAt: Date.now(),
    data: {
      moods: await moodRepository.list(10000),
      journal: await journalRepository.list(10000),
      sessions,
      messages,
      breathing: await breathingRepository.list(10000),
      safetyEvents: await safetyRepository.list(10000),
      voiceNotes: await voiceNoteRepository.list(10000),
    },
  };
}

/**
 * Writes all local data to a JSON file in the app's document directory and
 * opens the native share sheet so the user can save it where they choose.
 * Nothing is uploaded — sharing is a local OS action controlled by the user.
 */
export async function exportData(): Promise<Result<string>> {
  try {
    const bundle = await buildBundle();
    const json = JSON.stringify(bundle, null, 2);
    const fileUri = `${FileSystem.documentDirectory}oppuna-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Oppuna data',
        UTI: 'public.json',
      });
    }

    logger.info('Data export written', { fileUri });
    return ok(fileUri);
  } catch (cause) {
    logger.error('Data export failed', { cause: String(cause) });
    return err({ code: 'export_failed', message: 'Could not export your data.', cause });
  }
}

/** Deletes every piece of local data: database rows and recorded voice files. */
export async function deleteAllData(): Promise<Result<true>> {
  try {
    const notes = await voiceNoteRepository.list(10000);
    await Promise.all(
      notes.map((note) =>
        FileSystem.deleteAsync(note.uri, { idempotent: true }).catch(() => undefined),
      ),
    );
    await wipeAllTables();
    logger.info('All local data deleted');
    return ok(true);
  } catch (cause) {
    logger.error('Delete all data failed', { cause: String(cause) });
    return err({ code: 'delete_failed', message: 'Could not delete your data.', cause });
  }
}
