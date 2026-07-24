/**
 * Resolves and prepares the on-device GGUF model for llama.rn.
 *
 * Production Android: install-time Play Asset Delivery assets are copied once
 * from AssetManager into app-private storage (filesDir/ai-model/model.gguf).
 * Development: sideloaded GGUF under documentDirectory/models/.
 */

import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP } from '@/constants/app';
import { LOCAL_MODEL_CONFIG, requiredPrivateModelStorageBytes } from '@/config/localModel';
import { logger } from '@/utils/logger';
import { isValidGgufHeader } from '@/utils/gguf';

export { requiredPrivateModelStorageBytes };

const VERIFICATION_STORAGE_KEY = 'oppuna.localModel.verification.v1';
const RECOPY_ATTEMPTS_KEY = 'oppuna.localModel.recopyAttempts.v1';
const MAX_RECOPY_ATTEMPTS = 1;
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
  ggufHeaderValid: boolean | null;
  error: string | null;
}

export interface PrepareModelResult {
  path: string;
  copied: boolean;
  size: number;
  sha256: string | null;
  verified: boolean;
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

interface PrepareLocalModelNativeResult {
  path: string;
  copied: boolean;
  size: number;
  sha256: string;
  verified: boolean;
}

interface OppunaModelAssetNativeModule {
  prepareLocalModel: (
    assetFileName: string,
    expectedSize: number,
    expectedSha256: string,
    forceRecopy: boolean,
  ) => Promise<PrepareLocalModelNativeResult>;
  sha256File?: (path: string) => Promise<string>;
  validateGgufHeader?: (path: string) => Promise<boolean>;
  getAvailableStorageBytes?: () => Promise<number>;
  deletePrivateModel?: () => Promise<boolean>;
  getTotalMemoryBytes?: () => Promise<number>;
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

async function readGgufHeader(path: string): Promise<boolean> {
  const native = getNativeModule();
  if (native?.validateGgufHeader) {
    try {
      return await native.validateGgufHeader(path);
    } catch {
      // fall through to JS header read
    }
  }
  try {
    const uri = toFileUri(path);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
      length: 4,
      position: 0,
    });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return isValidGgufHeader(bytes);
  } catch {
    return false;
  }
}

async function findDevModelPath(): Promise<string | null> {
  const preferred = `${DEV_MODELS_DIR}${LOCAL_MODEL_CONFIG.fileName}`;
  const preferredInfo = await FileSystem.getInfoAsync(preferred);
  if (preferredInfo.exists) return toAbsolutePath(preferred);

  const legacy = `${DEV_MODELS_DIR}oppuna-model.gguf`;
  const legacyInfo = await FileSystem.getInfoAsync(legacy);
  if (legacyInfo.exists) return toAbsolutePath(legacy);

  try {
    const entries = await FileSystem.readDirectoryAsync(DEV_MODELS_DIR);
    const gguf = entries.find((name) => name.toLowerCase().endsWith('.gguf'));
    if (gguf) return toAbsolutePath(`${DEV_MODELS_DIR}${gguf}`);
  } catch {
    // Directory may not exist.
  }
  return null;
}

async function readRecopyAttempts(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(RECOPY_ATTEMPTS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

async function writeRecopyAttempts(count: number): Promise<void> {
  await AsyncStorage.setItem(RECOPY_ATTEMPTS_KEY, String(count));
}

/**
 * Copy install-time bundled asset into private storage (Android production path).
 */
export async function prepareBundledModel(options: {
  forceRecopy?: boolean;
} = {}): Promise<PrepareModelResult | null> {
  if (Platform.OS !== 'android') return null;
  const native = getNativeModule();
  if (!native?.prepareLocalModel) return null;

  const forceRecopy = options.forceRecopy === true;
  try {
    const result = await native.prepareLocalModel(
      LOCAL_MODEL_CONFIG.fileName,
      LOCAL_MODEL_CONFIG.expectedSize,
      LOCAL_MODEL_CONFIG.sha256,
      forceRecopy,
    );
    if (!result?.path) {
      logger.warn('Bundled model preparation returned no path');
      return null;
    }
    logger.info('Bundled model prepared', { copied: result.copied, verified: result.verified });
    if (result.verified) {
      await clearRecopyAttemptCounter().catch(() => undefined);
    }
    return {
      path: result.path,
      copied: result.copied,
      size: result.size,
      sha256: result.sha256 ?? null,
      verified: result.verified,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/INSUFFICIENT_STORAGE/i.test(message)) {
      throw new Error('Not enough storage for the on-device AI model.');
    }
    logger.warn('Bundled model preparation failed', { error: message });
    return null;
  }
}

/**
 * Resolve a filesystem path llama.rn can mmap-open.
 */
export async function getInstalledModelPath(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    try {
      const prepared = await prepareBundledModel();
      if (prepared?.path) return toAbsolutePath(prepared.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/storage/i.test(message)) throw error;
      logger.warn('Bundled model preparation failed', { error: message });
    }
    return null;
  }

  return findDevModelPath();
}

export async function isModelAvailable(): Promise<boolean> {
  const path = await getInstalledModelPath();
  if (!path) return false;
  const info = await FileSystem.getInfoAsync(toFileUri(path));
  return info.exists === true;
}

export async function deleteCorruptPrivateModel(): Promise<void> {
  const native = getNativeModule();
  if (native?.deletePrivateModel) {
    await native.deletePrivateModel().catch(() => undefined);
  }
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
  // Intentionally does NOT clear the recopy attempt counter.
}

/** Clears only the corruption-recopy attempt counter (after successful recovery). */
export async function clearRecopyAttemptCounter(): Promise<void> {
  await AsyncStorage.removeItem(RECOPY_ATTEMPTS_KEY);
}

export async function getRecopyAttemptCount(): Promise<number> {
  return readRecopyAttempts();
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
  return null;
}

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
      ggufHeaderValid: null,
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
      ggufHeaderValid: false,
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
      ggufHeaderValid: false,
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
      ggufHeaderValid: null,
      error: `Model size mismatch (expected ${LOCAL_MODEL_CONFIG.expectedSize}, got ${size}).`,
    };
  }

  const ggufHeaderValid = await readGgufHeader(path);
  if (!ggufHeaderValid) {
    return {
      ok: false,
      path,
      size,
      sha256: null,
      fullVerification: true,
      ggufHeaderValid: false,
      error: 'Invalid GGUF header.',
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
      ggufHeaderValid: true,
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
        ggufHeaderValid: true,
        error: 'Model SHA-256 mismatch — file may be corrupt.',
      };
    }
    if (!sha256) {
      logger.warn('SHA-256 configured but hasher unavailable; relying on size/header checks');
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
    ggufHeaderValid: true,
    error: null,
  };
}

/**
 * Attempt one repair recopy when the private model copy is corrupt.
 * Returns true when a recopy was attempted and verification succeeded.
 *
 * Counter semantics:
 * - Incremented before the repair attempt
 * - Cleared only after a verified successful prepare
 * - Failed repair leaves the counter elevated so startup does not loop
 */
export async function attemptModelRecopy(): Promise<boolean> {
  const attempts = await readRecopyAttempts();
  if (attempts >= MAX_RECOPY_ATTEMPTS) return false;

  await writeRecopyAttempts(attempts + 1);
  await clearStoredVerification();
  await deleteCorruptPrivateModel();

  const prepared = await prepareBundledModel({ forceRecopy: true });
  if (prepared?.verified) {
    await clearRecopyAttemptCounter();
    return true;
  }
  // Leave counter elevated — no immediate infinite repair loop.
  return false;
}

/** Document directory used for development / sideloaded GGUF files. */
export function getDevModelsDirectory(): string {
  return DEV_MODELS_DIR;
}

export { MAX_RECOPY_ATTEMPTS };
