/**
 * Model manager — owns the on-device GGUF lifecycle.
 *
 * Responsibilities: locate → verify → initialize provider → generate → unload.
 * Avoids the "cached rejected Promise" trap: failed initialization clears the
 * in-flight promise so `retryModelInitialization()` actually retries.
 */

import { Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { logger } from '@/utils/logger';
import { getDeviceCapability } from '@/services/deviceCapabilityService';
import {
  clearStoredVerification,
  getDevModelsDirectory,
  getInstalledModelPath,
  getModelMetadata,
  verifyModelIntegrity,
} from '@/services/modelAssetService';
import type { ChatMessage, GenerationOptions, LocalLLMProvider, TokenCallback } from '@/ai/providers';
import { LlamaRnProvider, LocalLLMProviderError } from '@/ai/providers';
import type { LocalModelState, LocalModelStatus } from '@/ai/types';

type ModelStateListener = (state: LocalModelState) => void;

const INITIAL_STATE: LocalModelState = {
  status: 'uninitialized',
  modelPath: null,
  modelId: null,
  error: null,
  loadedAt: null,
  initDurationMs: null,
  lastTokensPerSecond: null,
  deviceTier: null,
  providerId: null,
  contextSize: null,
  fallbackActive: true,
};

let state: LocalModelState = { ...INITIAL_STATE };
const listeners = new Set<ModelStateListener>();
let initPromise: Promise<LocalModelState> | null = null;
let activeProvider: LocalLLMProvider | null = null;
/** Injected provider factory for tests. */
let providerFactory: ((modelPath: string) => LocalLLMProvider) | null = null;

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

function setState(patch: Partial<LocalModelState>): void {
  state = { ...state, ...patch };
  emit();
}

export function getModelStatus(): LocalModelStatus {
  return state.status;
}

export function getModelState(): LocalModelState {
  return state;
}

/** @deprecated Prefer getModelState() — kept for existing callers. */
export function subscribeToModelState(listener: ModelStateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isModelReady(): boolean {
  return state.status === 'ready' || state.status === 'generating';
}

export function getModelPath(): string | null {
  return state.modelPath;
}

export function getModelsDirectory(): string {
  return getDevModelsDirectory();
}

export function getActiveProvider(): LocalLLMProvider | null {
  return activeProvider;
}

/** Test-only: inject a custom provider factory (e.g. FakeLocalLLMProvider). */
export function setProviderFactoryForTests(
  factory: ((modelPath: string) => LocalLLMProvider) | null,
): void {
  providerFactory = factory;
}

function createProvider(modelPath: string): LocalLLMProvider {
  if (providerFactory) {
    return providerFactory(modelPath);
  }
  const capability = getDeviceCapability();
  return new LlamaRnProvider({
    modelPath,
    contextSize: capability.recommendedContextSize,
    nGpuLayers: capability.recommendedGpuLayers,
    nThreads: capability.recommendedThreads,
    useMlock: false,
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new LocalLLMProviderError(`${label} timed out after ${timeoutMs}ms`, 'timeout')),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

async function runInitialization(): Promise<LocalModelState> {
  if (Platform.OS === 'web') {
    setState({
      ...INITIAL_STATE,
      status: 'unavailable',
      error: 'On-device AI is not available on web.',
      deviceTier: 'low',
    });
    return state;
  }

  const capability = getDeviceCapability();
  setState({
    status: 'locating',
    error: null,
    deviceTier: capability.tier,
    contextSize: capability.recommendedContextSize,
  });

  if (!capability.canRunLocalModel) {
    setState({
      status: 'unsupported-device',
      error: capability.reason,
      modelPath: null,
      modelId: null,
      loadedAt: null,
      fallbackActive: true,
    });
    return state;
  }

  try {
    const modelPath = await getInstalledModelPath();
    if (!modelPath) {
      logger.info('No on-device LLM model found');
      setState({
        status: 'unavailable',
        modelPath: null,
        modelId: null,
        error: null,
        loadedAt: null,
        providerId: null,
        fallbackActive: true,
      });
      return state;
    }

    setState({
      status: 'verifying',
      modelPath,
      modelId: getModelMetadata().modelName,
    });

    const integrity = await verifyModelIntegrity({ path: modelPath });
    if (!integrity.ok) {
      const isCorrupt =
        integrity.error?.includes('SHA-256') ||
        integrity.error?.includes('size mismatch') ||
        integrity.error?.includes('suspiciously small');
      setState({
        status: isCorrupt ? 'corrupted' : 'failed',
        error: integrity.error ?? 'Model verification failed',
        loadedAt: null,
        fallbackActive: true,
      });
      return state;
    }

    setState({ status: 'loading', error: null });
    const started = Date.now();

    if (activeProvider) {
      await activeProvider.unload().catch(() => undefined);
      activeProvider = null;
    }

    const provider = createProvider(modelPath);
    await withTimeout(
      provider.initialize(),
      LOCAL_MODEL_CONFIG.initTimeoutMs,
      'Model initialization',
    );
    activeProvider = provider;

    setState({
      status: 'ready',
      loadedAt: Date.now(),
      initDurationMs: Date.now() - started,
      error: null,
      providerId: provider.id,
      contextSize:
        provider instanceof LlamaRnProvider
          ? provider.getContextSize()
          : capability.recommendedContextSize,
      fallbackActive: false,
    });
    logger.info('On-device model ready', {
      modelId: state.modelId,
      initDurationMs: state.initDurationMs,
      providerId: provider.id,
    });
    return state;
  } catch (error) {
    const message =
      error instanceof LocalLLMProviderError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
    logger.error('Model initialization failed', { error: message });
    activeProvider = null;
    setState({
      status: 'failed',
      error: message,
      loadedAt: null,
      providerId: null,
      fallbackActive: true,
    });
    return state;
  }
}

/**
 * Locate, verify, and load the local model.
 * Concurrent callers share one in-flight promise; failures clear it for retry.
 */
export async function initializeModel(): Promise<LocalModelState> {
  if (state.status === 'ready' && activeProvider?.isReady()) {
    return state;
  }
  if (initPromise) return initPromise;

  initPromise = runInitialization().finally(() => {
    // Always clear so retries work after failure OR after unload.
    initPromise = null;
  });
  return initPromise;
}

/** @deprecated Prefer initializeModel() */
export async function initializeModelManager(): Promise<LocalModelState> {
  return initializeModel();
}

/** Clear failure state and attempt initialization again. */
export async function retryModelInitialization(): Promise<LocalModelState> {
  initPromise = null;
  if (activeProvider) {
    await activeProvider.unload().catch(() => undefined);
    activeProvider = null;
  }
  if (state.status === 'failed') {
    await clearStoredVerification().catch(() => undefined);
  }
  setState({
    status: 'uninitialized',
    error: null,
    loadedAt: null,
    initDurationMs: null,
  });
  return initializeModel();
}

export async function generate(
  messages: ChatMessage[],
  options?: GenerationOptions,
  onToken?: TokenCallback,
): Promise<string> {
  if (!activeProvider || !activeProvider.isReady()) {
    throw new LocalLLMProviderError('Local model is not ready', 'not_ready');
  }

  setState({ status: 'generating', error: null });
  const started = Date.now();
  try {
    const text = await activeProvider.chat(messages, options, onToken);
    const durationSec = Math.max(0.001, (Date.now() - started) / 1000);
    const approxTokens = Math.max(1, Math.ceil(text.length / 4));
    setState({
      status: 'ready',
      lastTokensPerSecond: approxTokens / durationSec,
    });
    return text;
  } catch (error) {
    setState({
      status: activeProvider.isReady() ? 'ready' : 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function cancelGeneration(): Promise<void> {
  if (activeProvider) {
    await activeProvider.cancelGeneration();
  }
}

export async function unloadModel(): Promise<void> {
  initPromise = null;
  if (activeProvider) {
    await activeProvider.unload().catch(() => undefined);
    activeProvider = null;
  }
  setState({
    status: state.modelPath ? 'uninitialized' : 'unavailable',
    loadedAt: null,
    providerId: null,
    error: null,
    fallbackActive: true,
  });
}

/** Legacy helpers used by older call sites / tests. */
export function markModelLoading(): void {
  if (state.status === 'unavailable') return;
  setState({ status: 'loading', error: null });
}

export function markModelReady(): void {
  setState({ status: 'ready', loadedAt: Date.now(), error: null });
}

export function markModelError(error: string): void {
  setState({ status: 'failed', error, loadedAt: null });
}

export function markModelReleased(): void {
  void unloadModel();
}

/** @internal Reset state for unit tests. */
export function __resetModelManagerForTests(): void {
  state = { ...INITIAL_STATE };
  initPromise = null;
  activeProvider = null;
  providerFactory = null;
  listeners.clear();
}

export { LOCAL_MODEL_CONFIG };
