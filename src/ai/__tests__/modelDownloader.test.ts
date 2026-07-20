import * as FileSystem from 'expo-file-system/legacy';

import {
  __resetModelDownloaderForTests,
  deleteModel,
  downloadModel,
  getModelDownloadState,
  subscribeToModelDownload,
} from '@/ai/modelDownloader';
import { __resetModelManagerForTests } from '@/ai/modelManager';

type ProgressCb = (p: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void;

function mockDownload(
  result: { uri: string; status: number } | undefined,
  progressSteps: { written: number; total: number }[] = [],
) {
  (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
    (_url: string, dest: string, _opts: unknown, cb: ProgressCb) => ({
      downloadAsync: jest.fn(async () => {
        for (const step of progressSteps) {
          cb({ totalBytesWritten: step.written, totalBytesExpectedToWrite: step.total });
        }
        return result === undefined ? undefined : { ...result, uri: result.uri || dest };
      }),
      cancelAsync: jest.fn(async () => undefined),
    }),
  );
}

describe('modelDownloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetModelDownloaderForTests();
    __resetModelManagerForTests();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.moveAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('downloads the model and reports progress then done', async () => {
    const states: string[] = [];
    const unsubscribe = subscribeToModelDownload((s) => states.push(s.phase));

    mockDownload({ uri: '', status: 200 }, [
      { written: 400, total: 800 },
      { written: 800, total: 800 },
    ]);

    const result = await downloadModel();

    expect(result.phase).toBe('done');
    expect(result.progress).toBe(1);
    expect(FileSystem.moveAsync).toHaveBeenCalledTimes(1);
    expect(states).toContain('downloading');
    expect(states).toContain('finalizing');
    expect(states).toContain('done');
    unsubscribe();
  });

  it('moves the finished file into the canonical model path', async () => {
    mockDownload({ uri: '', status: 200 });
    await downloadModel();

    const moveArg = (FileSystem.moveAsync as jest.Mock).mock.calls[0][0];
    expect(moveArg.from).toContain('oppuna-model.gguf.part');
    expect(moveArg.to).toContain('oppuna-model.gguf');
    expect(moveArg.to).not.toContain('.part');
  });

  it('reports an error and cleans up on an HTTP failure', async () => {
    mockDownload({ uri: '', status: 500 });

    const result = await downloadModel();

    expect(result.phase).toBe('error');
    expect(result.error).toMatch(/500/);
    expect(FileSystem.moveAsync).not.toHaveBeenCalled();
    // The partial file is removed.
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  it('reports an error when the download is interrupted (no result)', async () => {
    mockDownload(undefined);

    const result = await downloadModel();

    expect(result.phase).toBe('error');
    expect(FileSystem.moveAsync).not.toHaveBeenCalled();
  });

  it('ignores a duplicate download while one is in flight', async () => {
    let resolveDownload: (v: { uri: string; status: number }) => void = () => undefined;
    let downloadStarted = false;
    (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
      (_url: string, dest: string) => ({
        downloadAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              downloadStarted = true;
              resolveDownload = (v) => resolve({ ...v, uri: dest });
            }),
        ),
        cancelAsync: jest.fn(async () => undefined),
      }),
    );

    const first = downloadModel();
    // Let the first download progress until it is actually in flight.
    while (!downloadStarted) {
      await Promise.resolve();
    }

    // Second call should short-circuit and return the current (downloading) state.
    const second = await downloadModel();
    expect(second.phase).toBe('downloading');

    resolveDownload({ uri: '', status: 200 });
    const result = await first;
    expect(result.phase).toBe('done');
  });

  it('deletes the model and resets state', async () => {
    mockDownload({ uri: '', status: 200 });
    await downloadModel();

    await deleteModel();

    expect(FileSystem.deleteAsync).toHaveBeenCalled();
    expect(getModelDownloadState().phase).toBe('idle');
    expect(getModelDownloadState().progress).toBe(0);
  });
});
