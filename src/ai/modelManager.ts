/**
 * Model manager — discovers, stages, and tracks the on-device GGUF model.
 *
 * Models are loaded from the app's private document directory:
 *   `{documentDirectory}models/oppuna-model.gguf`
 * or staged there from a bundled app asset:
 *   `{bundleDirectory}assets/models/oppuna-model.gguf`
 *
 * No network access. If no model file is present the status becomes
 * `unavailable` and the orchestrator falls back to the rule engine.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { LLM_CONFIG } from '@/constants/app';
import { logger } from '@/utils/logger';
import type { ModelState } from '@/ai/types';

const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}${LLM_CONFIG.storageDir}/`;
const DEFAULT_MODEL_PATH = `${MODELS_DIR}${LLM_CONFIG.storageFilename}`;
const BUNDLED_MODEL_RELATIVE_PATHS = [
  `assets/${LLM_CONFIG.storageDir}/${LLM_CONFIG.storageFilename}`,
  `${LLM_CONFIG.storageDir}/${LLM_CONFIG.storageFilename}`,
] as const;

type FileSystemWithBundleDirectory = typeof FileSystem & {
  bundleDirectory?: string | null;
};

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

function joinUri(base: string, relativePath: string): string {
  return `${base.replace(/\/?$/, '/')}${relativePath.replace(/^\//, '')}`;
}

function getBundleDirectory(): string | null {
  return (FileSystem as FileSystemWithBundleDirectory).bundleDirectory ?? null;
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

  const bundledModel = await stageBundledModelIfPresent();
  if (bundledModel) return bundledModel;

  return null;
}

async function findBundledModelFile(): Promise<string | null> {
  const bundleDirectory = getBundleDirectory();
  if (!bundleDirectory) return null;

  for (const relativePath of BUNDLED_MODEL_RELATIVE_PATHS) {
    const candidate = joinUri(bundleDirectory, relativePath);
    const info = await FileSystem.getInfoAsync(candidate);
    if (info.exists) {
      return candidate;
    }
  }

  return null;
}

async function stageBundledModelIfPresent(): Promise<string | null> {
  const bundledModelPath = await findBundledModelFile();
  if (!bundledModelPath) return null;

  try {
    await FileSystem.copyAsync({ from: bundledModelPath, to: DEFAULT_MODEL_PATH });
    const staged = await FileSystem.getInfoAsync(DEFAULT_MODEL_PATH);
    if (staged.exists) {
      logger.info('Bundled on-device LLM model staged to private storage', {
        modelId: modelIdFromPath(DEFAULT_MODEL_PATH),
      });
      return DEFAULT_MODEL_PATH;
    }
  } catch (error) {
    logger.warn('Could not stage bundled model; trying bundled path directly', {
      error: String(error),
    });
  }

  return bundledModelPath;
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
      const modelPath = await findModelFile();

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
  listeners.clear();
}
