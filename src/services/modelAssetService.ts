/**
 * Resolves the on-device GGUF model path for llama.rn.
 *
 * Production Android builds deliver the model via an install-time Play Asset
 * Delivery pack (`ai_model_asset_pack`). Development builds may place a GGUF
 * under the app document directory. No runtime network downloads.
 */

import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP } from '@/constants/app';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { logger } from '@/utils/logger';

const VERIFICATION_STORAGE_KEY = 'oppuna.localModel.verification.v1';
const DEV_MODELS_DIR = `${FileSystem.documentDirectory ?? ''}models/`;

export interface ModelMetadata {
  modelName: string;
  version: string;
  sha256: string;
  expectedSize: number;
  fileName: string;
  assetPackName: string;
}

export interface ModelIntegrityResult {
  ok: boolean;
  path: string | null;
  size: number | null;
  sha256: string | null;
  fullVerification: boolean;
  error: string | null;
}

interface StoredVerification {
  modelId: string;
  modelVersion: string;
  appVersion: string;
  path: string;
  size: number;
  sha256: string | null;
  verifiedAt: number;
}

interface OppunaModelAssetNativeModule {
  getInstalledModelPath: (packName: string, fileName: string) => Promise<string | null>;
  sha256File?: (path: string) => Promise<string>;
}

function getNativeModule(): OppunaModelAssetNativeModule | null {
  const mod = NativeModules.OppunaModelAsset as OppunaModelAssetNativeModule | undefined;
  return mod ?? null;
}

export function getModelMetadata(): ModelMetadata {
  return {
    modelName: LOCAL_MODEL_CONFIG.id,
    version: LOCAL_MODEL_CONFIG.version,
    sha256: LOCAL_MODEL_CONFIG.sha256,
    expectedSize: LOCAL_MODEL_CONFIG.expectedSize,
    fileName: LOCAL_MODEL_CONFIG.fileName,
    assetPackName: LOCAL_MODEL_CONFIG.assetPackName,
  };
}

function toAbsolutePath(uriOrPath: string): string {
  return uriOrPath.startsWith('file://') ? uriOrPath.replace(/^file:\/\//, '') : uriOrPath;
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

async function findDevModelPath(): Promise<string | null> {
  const preferred = `${DEV_MODELS_DIR}${LOCAL_MODEL_CONFIG.fileName}`;
  const preferredInfo = await FileSystem.getInfoAsync(preferred);
  if (preferredInfo.exists) {
    return toAbsolutePath(preferred);
  }

  // Legacy filename from earlier Oppuna builds.
  const legacy = `${DEV_MODELS_DIR}oppuna-model.gguf`;
  const legacyInfo = await FileSystem.getInfoAsync(legacy);
  if (legacyInfo.exists) {
    return toAbsolutePath(legacy);
  }

  try {
    const entries = await FileSystem.readDirectoryAsync(DEV_MODELS_DIR);
    const gguf = entries.find((name) => name.toLowerCase().endsWith('.gguf'));
    if (gguf) {
      return toAbsolutePath(`${DEV_MODELS_DIR}${gguf}`);
    }
  } catch {
    // Directory may not exist yet.
  }

  return null;
}

/**
 * Resolve a filesystem path llama.rn can mmap-open.
 * Prefers Play Asset Delivery on Android, then local document storage.
 */
export async function getInstalledModelPath(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    const native = getNativeModule();
    if (native?.getInstalledModelPath) {
      try {
        const padPath = await native.getInstalledModelPath(
          LOCAL_MODEL_CONFIG.assetPackName,
          LOCAL_MODEL_CONFIG.fileName,
        );
        if (padPath) {
          logger.info('Resolved model via Play Asset Delivery', { path: padPath });
          return toAbsolutePath(padPath);
        }
      } catch (error) {
        logger.warn('Play Asset Delivery model path lookup failed', { error: String(error) });
      }
    }
  }

  const devPath = await findDevModelPath();
  if (devPath) {
    logger.info('Resolved model via local document storage', { path: devPath });
  }
  return devPath;
}

export async function isModelAvailable(): Promise<boolean> {
  const path = await getInstalledModelPath();
  if (!path) return false;
  const info = await FileSystem.getInfoAsync(toFileUri(path));
  return info.exists === true;
}

async function readStoredVerification(): Promise<StoredVerification | null> {
  try {
    const raw = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredVerification;
  } catch {
    return null;
  }
}

async function writeStoredVerification(value: StoredVerification): Promise<void> {
  await AsyncStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(value));
}

export async function clearStoredVerification(): Promise<void> {
  await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
}

function needsFullVerification(stored: StoredVerification | null, path: string, size: number): boolean {
  if (!stored) return true;
  if (stored.path !== path) return true;
  if (stored.size !== size) return true;
  if (stored.modelId !== LOCAL_MODEL_CONFIG.id) return true;
  if (stored.modelVersion !== LOCAL_MODEL_CONFIG.version) return true;
  if (stored.appVersion !== APP.version) return true;
  return false;
}

async function computeSha256(path: string): Promise<string | null> {
  const native = getNativeModule();
  if (native?.sha256File) {
    try {
      return await native.sha256File(path);
    } catch (error) {
      logger.warn('Native SHA-256 failed', { error: String(error) });
    }
  }
  // Without a native hasher we skip cryptographic verification rather than
  // loading a multi-GB file into JS memory.
  return null;
}

/**
 * Verify the installed model before first load.
 *
 * Strategy:
 * - Always: exists + size sanity (+ expectedSize when configured)
 * - Full SHA-256: first install, app/model version change, size mismatch,
 *   or when corruption is suspected (forceFull=true)
 * - Later launches: trusted stored metadata + size/version check
 */
export async function verifyModelIntegrity(options: {
  path?: string | null;
  forceFull?: boolean;
  suspectCorruption?: boolean;
} = {}): Promise<ModelIntegrityResult> {
  const path = options.path ?? (await getInstalledModelPath());
  if (!path) {
    return {
      ok: false,
      path: null,
      size: null,
      sha256: null,
      fullVerification: false,
      error: 'Model file not found on device.',
    };
  }

  const info = await FileSystem.getInfoAsync(toFileUri(path));
  if (!info.exists) {
    return {
      ok: false,
      path,
      size: null,
      sha256: null,
      fullVerification: false,
      error: 'Model path does not exist.',
    };
  }

  const size = 'size' in info && typeof info.size === 'number' ? info.size : null;
  if (size === null || size < LOCAL_MODEL_CONFIG.minPlausibleSizeBytes) {
    return {
      ok: false,
      path,
      size,
      sha256: null,
      fullVerification: false,
      error: 'Model file is missing or suspiciously small.',
    };
  }

  if (LOCAL_MODEL_CONFIG.expectedSize > 0 && size !== LOCAL_MODEL_CONFIG.expectedSize) {
    return {
      ok: false,
      path,
      size,
      sha256: null,
      fullVerification: false,
      error: `Model size mismatch (expected ${LOCAL_MODEL_CONFIG.expectedSize}, got ${size}).`,
    };
  }

  const stored = await readStoredVerification();
  const runFull =
    options.forceFull === true ||
    options.suspectCorruption === true ||
    needsFullVerification(stored, path, size);

  if (!runFull && stored) {
    return {
      ok: true,
      path,
      size,
      sha256: stored.sha256,
      fullVerification: false,
      error: null,
    };
  }

  let sha256: string | null = null;
  const expectedSha = LOCAL_MODEL_CONFIG.sha256;
  if (expectedSha.length > 0) {
    sha256 = await computeSha256(path);
    if (sha256 && sha256.toLowerCase() !== expectedSha.toLowerCase()) {
      return {
        ok: false,
        path,
        size,
        sha256,
        fullVerification: true,
        error: 'Model SHA-256 mismatch — file may be corrupt.',
      };
    }
    if (!sha256) {
      logger.warn('SHA-256 configured but hasher unavailable; relying on size/version checks');
    }
  }

  await writeStoredVerification({
    modelId: LOCAL_MODEL_CONFIG.id,
    modelVersion: LOCAL_MODEL_CONFIG.version,
    appVersion: APP.version,
    path,
    size,
    sha256,
    verifiedAt: Date.now(),
  });

  return {
    ok: true,
    path,
    size,
    sha256,
    fullVerification: true,
    error: null,
  };
}

/** Document directory used for development / sideloaded GGUF files. */
export function getDevModelsDirectory(): string {
  return DEV_MODELS_DIR;
}
