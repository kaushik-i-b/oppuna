/**
 * User-initiated download of the on-device Qwen weights.
 *
 * Play on-demand delivery is tried first (Play Store moves the bytes; the app
 * does not need a general network client). Sideload builds fall back to the
 * pinned Hugging Face file. Either way the file is rejected unless size and
 * SHA-256 match config/local-model.json. Chat text is not uploaded.
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { retryModelInitialization, unloadModel } from '@/ai/modelManager';
import {
  clearStoredVerification,
  deleteCorruptPrivateModel,
  prepareBundledModel,
  recordVerifiedDownload,
} from '@/services/modelAssetService';
import { isPinnedModelDownloadUrl } from '@/services/modelDownloadPolicy';
import { logger } from '@/utils/logger';

export type ModelDownloadPhase = 'idle' | 'downloading' | 'preparing' | 'error';

export interface ModelDownloadSnapshot {
  phase: ModelDownloadPhase;
  bytesDownloaded: number;
  totalBytes: number;
  error: string | null;
}

interface NativeDownloadResult {
  path: string;
  size: number;
  sha256?: string | null;
  verified?: boolean;
}

interface ModelAssetNative {
  fetchOnDemandPack?: (packName: string) => Promise<{ status?: string }>;
  downloadPinnedModel?: (
    url: string,
    expectedSize: number,
    expectedSha256: string,
  ) => Promise<NativeDownloadResult>;
  cancelModelDownload?: () => Promise<boolean>;
  removeOnDemandPack?: (packName: string) => Promise<boolean>;
  addListener?: (event: string) => void;
  removeListeners?: (count: number) => void;
}

type ProgressEvent = {
  phase?: string;
  bytesDownloaded?: number;
  totalBytes?: number;
};

const listeners = new Set<(snapshot: ModelDownloadSnapshot) => void>();

let snapshot: ModelDownloadSnapshot = {
  phase: 'idle',
  bytesDownloaded: 0,
  totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
  error: null,
};

let activeDownload: Promise<string | null> | null = null;

export function __resetModelDownloadForTests(): void {
  activeDownload = null;
  snapshot = {
    phase: 'idle',
    bytesDownloaded: 0,
    totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
    error: null,
  };
}

function nativeModule(): ModelAssetNative | null {
  const mod = NativeModules.OppunaModelAsset as ModelAssetNative | undefined;
  return mod ?? null;
}

function emit(next: ModelDownloadSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

export function getModelDownloadSnapshot(): ModelDownloadSnapshot {
  return snapshot;
}

export function subscribeModelDownload(
  listener: (snapshot: ModelDownloadSnapshot) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function nativeErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : '';
  }
  return '';
}

export function modelDownloadErrorMessage(error: unknown): string {
  const code = nativeErrorCode(error);
  const message = error instanceof Error ? error.message : '';
  if (code === 'DOWNLOAD_CANCELED') return 'Download canceled.';
  if (code === 'INSUFFICIENT_STORAGE' || /not enough storage|insufficient storage/i.test(message)) {
    return 'Not enough free space for the on-device model (about 941 MB).';
  }
  if (code === 'NEED_CONFIRMATION') {
    return 'Confirm the Play Store download to add the on-device model.';
  }
  if (code === 'NETWORK_BLOCKED') {
    return 'This install cannot download the model. Use the Google Play listing, where the model is a separate download.';
  }
  return 'Could not download the on-device model. Guided replies still work without it.';
}

function shouldTryDirectDownload(error: unknown): boolean {
  const code = nativeErrorCode(error);
  return code !== 'DOWNLOAD_CANCELED' && code !== 'INSUFFICIENT_STORAGE' && code !== 'NEED_CONFIRMATION';
}

async function finishVerified(path: string): Promise<string> {
  emit({
    phase: 'preparing',
    bytesDownloaded: LOCAL_MODEL_CONFIG.expectedSize,
    totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
    error: null,
  });
  await retryModelInitialization();
  emit({
    phase: 'idle',
    bytesDownloaded: LOCAL_MODEL_CONFIG.expectedSize,
    totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
    error: null,
  });
  return path;
}

/**
 * Download the Qwen weights after an explicit user action.
 * Returns the local path, or null when the user canceled.
 */
export function downloadOnDeviceModel(): Promise<string | null> {
  if (activeDownload) return activeDownload;
  activeDownload = runDownload().finally(() => {
    activeDownload = null;
  });
  return activeDownload;
}

async function runDownload(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    throw new Error('On-device model download is available on Android.');
  }
  const native = nativeModule();
  if (!native?.fetchOnDemandPack && !native?.downloadPinnedModel) {
    throw new Error('This build cannot download the on-device model.');
  }

  emit({
    phase: 'downloading',
    bytesDownloaded: 0,
    totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
    error: null,
  });

  const emitter = native.addListener ? new NativeEventEmitter(NativeModules.OppunaModelAsset) : null;
  const subscription = emitter?.addListener('OppunaModelDownloadProgress', (event: ProgressEvent) => {
    emit({
      phase: 'downloading',
      bytesDownloaded: event.bytesDownloaded ?? snapshot.bytesDownloaded,
      totalBytes: event.totalBytes && event.totalBytes > 0 ? event.totalBytes : snapshot.totalBytes,
      error: null,
    });
  });

  try {
    const existing = await prepareBundledModel({ userInitiated: true });
    if (existing?.path && existing.verified) {
      return finishVerified(existing.path);
    }

    if (native.fetchOnDemandPack) {
      try {
        await native.fetchOnDemandPack(LOCAL_MODEL_CONFIG.assetPackName);
        const prepared = await prepareBundledModel({ userInitiated: true, forceFullSha: true });
        if (prepared?.path && prepared.verified) {
          return finishVerified(prepared.path);
        }
      } catch (error) {
        if (!shouldTryDirectDownload(error)) throw error;
        logger.info('Play model pack unavailable; trying the pinned model file');
      }
    }

    if (!native.downloadPinnedModel) {
      throw new Error('Could not download the on-device model.');
    }
    const url = LOCAL_MODEL_CONFIG.downloadUrl;
    if (!isPinnedModelDownloadUrl(url)) {
      throw new Error('Model download URL is not the pinned file.');
    }
    const downloaded = await native.downloadPinnedModel(
      url,
      LOCAL_MODEL_CONFIG.expectedSize,
      LOCAL_MODEL_CONFIG.sha256,
    );
    if (!downloaded?.path) {
      throw new Error('Model download did not produce a file.');
    }
    try {
      await recordVerifiedDownload({
        path: downloaded.path,
        size: downloaded.size,
        sha256: downloaded.sha256 ?? null,
      });
    } catch (error) {
      await deleteCorruptPrivateModel();
      throw error;
    }
    return finishVerified(downloaded.path);
  } catch (error) {
    const code = nativeErrorCode(error);
    if (code === 'DOWNLOAD_CANCELED') {
      emit({ ...snapshot, phase: 'idle', error: null });
      return null;
    }
    const message = modelDownloadErrorMessage(error);
    emit({ ...snapshot, phase: 'error', error: message });
    throw new Error(message);
  } finally {
    subscription?.remove();
  }
}

export async function cancelOnDeviceModelDownload(): Promise<void> {
  await nativeModule()?.cancelModelDownload?.().catch(() => undefined);
}

/** Delete the private copy and the Play pack. Guided replies stay available. */
export async function removeDownloadedOnDeviceModel(): Promise<void> {
  await cancelOnDeviceModelDownload();
  await unloadModel();
  await deleteCorruptPrivateModel();
  await clearStoredVerification();
  await nativeModule()?.removeOnDemandPack?.(LOCAL_MODEL_CONFIG.assetPackName).catch(() => undefined);
  emit({
    phase: 'idle',
    bytesDownloaded: 0,
    totalBytes: LOCAL_MODEL_CONFIG.expectedSize,
    error: null,
  });
  await retryModelInitialization().catch(() => undefined);
}
