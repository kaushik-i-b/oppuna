/**
 * Model downloader — fetches the on-device Llama model once, on explicit user
 * request, then hands off to the model manager so the local LLM can load it.
 *
 * Privacy notes:
 * - This is the *only* place in the app that reaches a remote host, and it
 *   only ever downloads read-only model weights over an allow-listed HTTPS
 *   connection (see `services/networkGuard`). No user data is uploaded.
 * - The download is never automatic; the user starts it from Settings.
 * - Once the weights are on the device the app runs fully offline forever.
 *
 * The download streams to a `.part` file and is atomically moved into place
 * only after it finishes, so a cancelled or failed download can never be
 * mistaken for a ready model.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { LLAMA_MODEL } from '@/constants/app';
import { logger } from '@/utils/logger';
import { getDefaultModelPath, getModelsDirectory, refreshModelState } from '@/ai/modelManager';
import { isModelDownloadUrl } from '@/services/networkGuard';

export type DownloadPhase = 'idle' | 'downloading' | 'finalizing' | 'done' | 'error' | 'cancelled';

export interface ModelDownloadState {
  phase: DownloadPhase;
  /** Fraction downloaded in the range [0, 1]. */
  progress: number;
  bytesWritten: number;
  totalBytes: number;
  error: string | null;
}

type Listener = (state: ModelDownloadState) => void;

const INITIAL_STATE: ModelDownloadState = {
  phase: 'idle',
  progress: 0,
  bytesWritten: 0,
  totalBytes: LLAMA_MODEL.approxBytes,
  error: null,
};

let state: ModelDownloadState = { ...INITIAL_STATE };
const listeners = new Set<Listener>();

// Non-null while a download is in flight; used to support cancellation.
let activeDownload: FileSystem.DownloadResumable | null = null;

function emit(): void {
  for (const listener of listeners) listener(state);
}

function setState(patch: Partial<ModelDownloadState>): void {
  state = { ...state, ...patch };
  emit();
}

export function getModelDownloadState(): ModelDownloadState {
  return state;
}

export function subscribeToModelDownload(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isModelDownloading(): boolean {
  return state.phase === 'downloading' || state.phase === 'finalizing';
}

function partPath(): string {
  return `${getDefaultModelPath()}.part`;
}

async function ensureModelsDirectory(): Promise<void> {
  const dir = getModelsDirectory();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function safeDelete(path: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch (error) {
    logger.warn('Failed to delete file', { path, error: String(error) });
  }
}

/**
 * Download the on-device model. Safe to call once at a time; concurrent calls
 * while a download is in flight are ignored and return the current state.
 */
export async function downloadModel(): Promise<ModelDownloadState> {
  if (isModelDownloading()) {
    logger.warn('Model download already in progress; ignoring duplicate request');
    return state;
  }

  if (Platform.OS === 'web') {
    setState({ phase: 'error', error: 'On-device AI is not available on web.' });
    return state;
  }

  // Defence in depth: refuse to reach any host that is not explicitly
  // allow-listed for model downloads.
  if (!isModelDownloadUrl(LLAMA_MODEL.downloadUrl)) {
    setState({ phase: 'error', error: 'Model source is not allow-listed.' });
    logger.error('Refusing model download from non-allow-listed host', {
      url: LLAMA_MODEL.downloadUrl,
    });
    return state;
  }

  setState({
    phase: 'downloading',
    progress: 0,
    bytesWritten: 0,
    totalBytes: LLAMA_MODEL.approxBytes,
    error: null,
  });

  const destination = partPath();

  try {
    await ensureModelsDirectory();
    // Start clean so a stale partial file can never corrupt a fresh download.
    await safeDelete(destination);

    const download = FileSystem.createDownloadResumable(
      LLAMA_MODEL.downloadUrl,
      destination,
      {},
      (progress) => {
        const total =
          progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesExpectedToWrite
            : LLAMA_MODEL.approxBytes;
        const written = progress.totalBytesWritten;
        setState({
          phase: 'downloading',
          bytesWritten: written,
          totalBytes: total,
          progress: total > 0 ? Math.min(written / total, 1) : 0,
        });
      },
    );
    activeDownload = download;

    const result = await download.downloadAsync();
    activeDownload = null;

    // A cancel() during flight resolves with an undefined result.
    if (state.phase === 'cancelled') {
      await safeDelete(destination);
      return state;
    }

    if (!result || (result.status && result.status >= 400)) {
      await safeDelete(destination);
      const message = result ? `Download failed (HTTP ${result.status}).` : 'Download was interrupted.';
      setState({ phase: 'error', error: message });
      return state;
    }

    setState({ phase: 'finalizing', progress: 1 });

    const finalPath = getDefaultModelPath();
    await safeDelete(finalPath);
    await FileSystem.moveAsync({ from: destination, to: finalPath });

    await refreshModelState();

    setState({ phase: 'done', progress: 1 });
    logger.info('On-device model downloaded and ready', { model: LLAMA_MODEL.id });
    return state;
  } catch (error) {
    activeDownload = null;
    await safeDelete(destination);
    if (state.phase === 'cancelled') return state;
    const message = error instanceof Error ? error.message : String(error);
    setState({ phase: 'error', error: message });
    logger.error('Model download failed', { error: message });
    return state;
  }
}

/** Cancel an in-flight download and clean up the partial file. */
export async function cancelModelDownload(): Promise<void> {
  const download = activeDownload;
  activeDownload = null;
  setState({ phase: 'cancelled' });
  if (download) {
    try {
      await download.cancelAsync();
    } catch (error) {
      logger.warn('Failed to cancel model download', { error: String(error) });
    }
  }
  await safeDelete(partPath());
}

/** Remove the downloaded model from the device and reset state. */
export async function deleteModel(): Promise<void> {
  if (isModelDownloading()) {
    await cancelModelDownload();
  }
  await safeDelete(getDefaultModelPath());
  await safeDelete(partPath());
  await refreshModelState();
  setState({ ...INITIAL_STATE });
  logger.info('On-device model deleted');
}

/** @internal Reset downloader state for unit tests. */
export function __resetModelDownloaderForTests(): void {
  state = { ...INITIAL_STATE };
  activeDownload = null;
  listeners.clear();
}
