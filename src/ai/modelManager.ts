/**
 * Model manager — discovers, stages, and tracks the on-device GGUF model.
 *
 * Models are loaded from the app's private document directory:
 *   `{documentDirectory}models/oppuna-model.gguf`
 *
 * No network access. If no model file is present the status becomes
 * `unavailable` and the orchestrator falls back to the rule engine.
 */

import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { LLM_CONFIG } from '@/constants/app';
import { logger } from '@/utils/logger';
import type { ModelState } from '@/ai/types';

const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}${LLM_CONFIG.storageDir}/`;
const DEFAULT_MODEL_PATH = `${MODELS_DIR}${LLM_CONFIG.storageFilename}`;

type ModelStateListener = (state: ModelState) => void;

const INITIAL_STATE: ModelState = {
  status: 'idle',
  modelPath: null,
  modelId: null,
  error: null,
  loadedAt: null,
};

let state: ModelState = { ...INITIAL_STATE };
const listeners = new Set<ModelStateListener>();
let initPromise: Promise<ModelState> | null = null;
let bundledModelAssetModule: number | null = null;

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

function setState(patch: Partial<ModelState>): void {
  state = { ...state, ...patch };
  emit();
}

export function getModelState(): ModelState {
  return state;
}

/** Subscribe to model lifecycle updates. Returns an unsubscribe function. */
export function subscribeToModelState(listener: ModelStateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function modelIdFromPath(path: string): string {
  const filename = path.split('/').pop() ?? 'model';
  return filename.replace(/\.gguf$/i, '');
}

async function ensureModelsDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

async function findModelFile(): Promise<string | null> {
  const preferred = await FileSystem.getInfoAsync(DEFAULT_MODEL_PATH);
  if (preferred.exists) {
    return DEFAULT_MODEL_PATH;
  }

  try {
    const entries = await FileSystem.readDirectoryAsync(MODELS_DIR);
    const gguf = entries.find((name) => name.toLowerCase().endsWith('.gguf'));
    if (gguf) {
      return `${MODELS_DIR}${gguf}`;
    }
  } catch (error) {
    logger.warn('Could not scan models directory', { error: String(error) });
  }

  return null;
}

async function stageBundledModelAsset(): Promise<string | null> {
  if (bundledModelAssetModule === null) {
    return null;
  }

  try {
    const asset = Asset.fromModule(bundledModelAssetModule);
    await asset.downloadAsync();
    const sourceUri = asset.localUri ?? asset.uri ?? null;

    if (!sourceUri || /^https?:\/\//i.test(sourceUri)) {
      logger.warn('Bundled LLM asset did not resolve to a local file');
      return null;
    }

    await FileSystem.copyAsync({ from: sourceUri, to: DEFAULT_MODEL_PATH });
    const copied = await FileSystem.getInfoAsync(DEFAULT_MODEL_PATH);
    return copied.exists ? DEFAULT_MODEL_PATH : null;
  } catch (error) {
    logger.warn('Could not stage bundled LLM model asset', { error: String(error) });
    return null;
  }
}

/**
 * Register a bundled GGUF asset for release builds.
 *
 * Example:
 *   registerBundledModelAsset(require('../../assets/models/oppuna-model.gguf'));
 */
export function registerBundledModelAsset(assetModule: number): void {
  bundledModelAssetModule = assetModule;
  initPromise = null;
}

/**
 * Scan local storage for a GGUF model. Safe to call multiple times.
 * Does not load weights into memory — that happens in `localLLMClient.warmUp`.
 */
export async function initializeModelManager(): Promise<ModelState> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (Platform.OS === 'web') {
      setState({
        status: 'unavailable',
        modelPath: null,
        modelId: null,
        error: null,
        loadedAt: null,
      });
      return state;
    }

    setState({ status: 'checking', error: null });

    try {
      await ensureModelsDirectory();
      const modelPath = (await findModelFile()) ?? (await stageBundledModelAsset());

      if (!modelPath) {
        logger.info('No on-device LLM model found in local storage', { dir: MODELS_DIR });
        setState({
          status: 'unavailable',
          modelPath: null,
          modelId: null,
          error: null,
          loadedAt: null,
        });
        return state;
      }

      setState({
        status: 'idle',
        modelPath,
        modelId: modelIdFromPath(modelPath),
        error: null,
        loadedAt: null,
      });
      logger.info('On-device LLM model located', { modelId: state.modelId });
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Model manager initialization failed', { error: message });
      setState({
        status: 'error',
        modelPath: null,
        modelId: null,
        error: message,
        loadedAt: null,
      });
      return state;
    }
  })();

  return initPromise;
}

/** Resolved model path, or null when no model is available. */
export function getModelPath(): string | null {
  return state.modelPath;
}

export function markModelLoading(): void {
  if (state.status === 'unavailable') return;
  setState({ status: 'loading', error: null });
}

export function markModelReady(): void {
  setState({ status: 'ready', loadedAt: Date.now(), error: null });
}

export function markModelError(error: string): void {
  setState({ status: 'error', error, loadedAt: null });
}

export function markModelReleased(): void {
  if (state.modelPath) {
    setState({ status: 'idle', loadedAt: null, error: null });
  } else {
    setState({ status: 'unavailable', loadedAt: null, error: null });
  }
}

/** Directory where GGUF models should be placed on the device. */
export function getModelsDirectory(): string {
  return MODELS_DIR;
}

/** Whether the model file exists and the context has been warmed up. */
export function isModelReady(): boolean {
  return state.status === 'ready';
}

/** @internal Reset state for unit tests. */
export function __resetModelManagerForTests(): void {
  state = { ...INITIAL_STATE };
  initPromise = null;
  bundledModelAssetModule = null;
  listeners.clear();
}
