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

export const EXPORT_WARNING =
  'This export may contain private journal, mood, and conversation data. Anyone with access to the exported file may be able to read it.';

const EXPORT_PREFIX = 'oppuna-export-';
const EXPORT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

function exportDirectory(): string {
  return FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
}

export function isExportFileName(name: string): boolean {
  return name.startsWith(EXPORT_PREFIX) && name.endsWith('.json');
}

/** Removes stale export JSON files from cache/document storage. */
export async function cleanupStaleExportFiles(now = Date.now()): Promise<number> {
  const dir = exportDirectory();
  if (!dir) return 0;

  let removed = 0;
  try {
    const entries = await FileSystem.readDirectoryAsync(dir);
    for (const name of entries) {
      if (!isExportFileName(name)) continue;
      const uri = `${dir}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      const mtime =
        info.exists && 'modificationTime' in info && typeof info.modificationTime === 'number'
          ? info.modificationTime * 1000
          : 0;
      if (mtime > 0 && now - mtime > EXPORT_MAX_AGE_MS) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        removed += 1;
      }
    }
  } catch (error) {
    logger.warn('Export cleanup scan failed', { error: String(error) });
  }
  return removed;
}

export async function deleteExportFile(fileUri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch (error) {
    logger.warn('Export file deletion failed', { error: String(error) });
  }
}

/**
 * Writes wellness data to a temporary JSON file and opens the system share sheet.
 * The export is never uploaded automatically.
 */
export async function exportData(): Promise<Result<string>> {
  let fileUri: string | null = null;
  try {
    await cleanupStaleExportFiles();

    const bundle = await buildBundle();
    const json = JSON.stringify(bundle, null, 2);
    const dir = exportDirectory();
    if (!dir) {
      return err({ code: 'export_failed', message: 'Could not access local storage for export.' });
    }

    fileUri = `${dir}${EXPORT_PREFIX}${Date.now()}.json`;
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

    logger.info('Data export prepared');
    return ok(fileUri);
  } catch (cause) {
    logger.error('Data export failed', { cause: String(cause) });
    return err({ code: 'export_failed', message: 'Could not export your data.', cause });
  } finally {
    if (fileUri) {
      // Best-effort immediate cleanup after share sheet returns.
      await deleteExportFile(fileUri);
    }
  }
}

/** Deletes every piece of local wellness data (not the bundled on-device model). */
export async function deleteAllData(): Promise<Result<true>> {
  try {
    const notes = await voiceNoteRepository.list(10000);
    await Promise.all(
      notes.map((note) =>
        FileSystem.deleteAsync(note.uri, { idempotent: true }).catch(() => undefined),
      ),
    );
    await cleanupStaleExportFiles();
    await wipeAllTables();
    const { clearAnalytics } = await import('@/services/analyticsService');
    const { clearReviewPromptState } = await import('@/services/reviewPromptService');
    await clearAnalytics();
    await clearReviewPromptState();
    logger.info('All local data deleted');
    return ok(true);
  } catch (cause) {
    logger.error('Delete all data failed', { cause: String(cause) });
    return err({ code: 'delete_failed', message: 'Could not delete your data.', cause });
  }
}
