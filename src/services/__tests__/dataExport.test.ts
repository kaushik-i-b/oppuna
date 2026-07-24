import {
  cleanupStaleExportFiles,
  deleteExportFile,
  EXPORT_WARNING,
  exportData,
  isExportFileName,
} from '@/services/dataExport';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

jest.mock('@/database', () => ({
  chatRepository: { listSessions: jest.fn(async () => []), listMessages: jest.fn(async () => []) },
  moodRepository: { list: jest.fn(async () => []) },
  journalRepository: { list: jest.fn(async () => []) },
  breathingRepository: { list: jest.fn(async () => []) },
  safetyRepository: { list: jest.fn(async () => []) },
  voiceNoteRepository: { list: jest.fn(async () => []) },
  wipeAllTables: jest.fn(async () => undefined),
}));

describe('dataExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('identifies export filenames', () => {
    expect(isExportFileName('oppuna-export-123.json')).toBe(true);
    expect(isExportFileName('notes.json')).toBe(false);
  });

  it('exports to cache and deletes the file afterward', async () => {
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

    const result = await exportData();

    expect(result.ok).toBe(true);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('removes stale export files', async () => {
    const old = (Date.now() - 48 * 60 * 60 * 1000) / 1000;
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
      'oppuna-export-old.json',
      'keep.txt',
    ]);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: old,
    });
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

    const removed = await cleanupStaleExportFiles();
    expect(removed).toBe(1);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining('oppuna-export-old.json'),
      { idempotent: true },
    );
  });

  it('exposes a user-facing export warning', () => {
    expect(EXPORT_WARNING).toMatch(/private journal/i);
  });

  it('deleteExportFile is idempotent', async () => {
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    await deleteExportFile('file:///cache/oppuna-export-1.json');
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });
});
