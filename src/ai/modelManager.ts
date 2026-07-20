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

/**
 * Result of installing an on-device model file from an external URI.
 * The `installedPath` is a `file://` URI in Oppuna's private models directory.
 */
export interface InstallModelResult {
  installedPath: string;
  modelId: string;
  sizeBytes: number | null;
}

const GGUF_EXTENSION = /\.gguf$/i;

function sanitizeFilename(name: string | undefined): string {
  const base = (name ?? '').split('/').pop() ?? '';
  const trimmed = base.trim();
  if (trimmed.length === 0) return LLM_CONFIG.storageFilename;
  const safe = trimmed.replace(/[^A-Za-z0-9._-]/g, '_');
  return GGUF_EXTENSION.test(safe) ? safe : `${safe}.gguf`;
}

/**
 * Copy a GGUF model file from an external URI (e.g. one returned by
 * `expo-document-picker`) into Oppuna's private models directory and refresh
 * the model manager state. The source file is never touched.
 *
 * The copy stays local to the device — no network access is performed here or
 * anywhere else in the AI layer.
 */
export async function installModelFromUri(
  sourceUri: string,
  options: { filename?: string } = {},
): Promise<InstallModelResult> {
  if (Platform.OS === 'web') {
    throw new Error('On-device model install is not supported on web.');
  }
  if (!sourceUri) {
    throw new Error('Missing source URI for model install.');
  }

  await ensureModelsDirectory();

  const info = await FileSystem.getInfoAsync(sourceUri);
  if (!info.exists) {
    throw new Error('The selected file could not be read from device storage.');
  }
  if (info.isDirectory) {
    throw new Error('Please select a single GGUF model file, not a folder.');
  }

  const filename = sanitizeFilename(options.filename ?? sourceUri.split('/').pop() ?? undefined);
  const destination = `${MODELS_DIR}${filename}`;

  const destInfo = await FileSystem.getInfoAsync(destination);
  if (destInfo.exists) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
  }

  setState({ status: 'checking', error: null });

  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destination });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to install on-device model', { error: message });
    setState({ status: 'error', error: message });
    throw new Error(`Could not copy the model into local storage: ${message}`);
  }

  const finalInfo = await FileSystem.getInfoAsync(destination);
  const sizeBytes = finalInfo.exists && !finalInfo.isDirectory ? finalInfo.size : null;
  const modelId = modelIdFromPath(destination);

  setState({
    status: 'idle',
    modelPath: destination,
    modelId,
    error: null,
    loadedAt: null,
  });
  logger.info('On-device LLM model installed', { modelId, sizeBytes });

  return { installedPath: destination, modelId, sizeBytes };
}

/**
 * Remove the currently-installed on-device model file, if any, and reset the
 * model manager state to `unavailable`.
 */
export async function removeInstalledModel(): Promise<void> {
  if (Platform.OS === 'web') return;

  const path = state.modelPath;
  if (!path) {
    setState({
      status: 'unavailable',
      modelPath: null,
      modelId: null,
      error: null,
      loadedAt: null,
    });
    return;
  }

  try {
    await FileSystem.deleteAsync(path, { idempotent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to delete installed on-device model', { error: message });
  }

  setState({
    status: 'unavailable',
    modelPath: null,
    modelId: null,
    error: null,
    loadedAt: null,
  });
}

/** @internal Reset state for unit tests. */
export function __resetModelManagerForTests(): void {
  state = { ...INITIAL_STATE };
  initPromise = null;
  listeners.clear();
}
