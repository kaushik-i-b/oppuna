/**
 * Model manager — owns the on-device GGUF lifecycle.
 *
 * Responsibilities: locate → prepare → verify → initialize provider → generate → unload.
 * Single-flight initialization; canceled attempts never promote to ready.
 */

import { Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { logger } from '@/utils/logger';
import { getDeviceCapability } from '@/services/deviceCapabilityService';
import {
  attemptModelRecopy,
  clearStoredVerification,
  getDevModelsDirectory,
  getInstalledModelPath,
  getModelMetadata,
  requestUserModelPreparationRetry,
  verifyModelIntegrity,
} from '@/services/modelAssetService';
import type { ChatMessage, GenerationOptions, LocalLLMProvider, TokenCallback } from '@/ai/providers';
import { LocalLLMProviderError } from '@/ai/providers/LocalLLMProvider';
import type { LocalModelState, LocalModelStatus } from '@/ai/types';

type ModelStateListener = (state: LocalModelState) => void;

const INITIAL_STATE: LocalModelState = {
  status: 'idle',
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
let providerFactory: ((modelPath: string) => LocalLLMProvider) | null = null;
let initAttemptId = 0;
let initCanceled = false;
let activeGenerationId = 0;

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

function setState(patch: Partial<LocalModelState>): void {
  state = { ...state, ...patch };
  emit();
}

function isInitAttemptCurrent(attemptId: number): boolean {
  return !initCanceled && attemptId === initAttemptId;
}

export function getModelStatus(): LocalModelStatus {
  return state.status;
}

export function getModelState(): LocalModelState {
  return state;
}

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

export function setProviderFactoryForTests(
  factory: ((modelPath: string) => LocalLLMProvider) | null,
): void {
  providerFactory = factory;
}

async function createProvider(modelPath: string): Promise<LocalLLMProvider> {
  if (providerFactory) return providerFactory(modelPath);
  // Lazy-load so librnllama is not linked at app process start (avoids
  // UnsatisfiedLinkError / early native crashes before UI can render).
  const { LlamaRnProvider } = await import('@/ai/providers/LlamaRnProvider');
  const capability = getDeviceCapability();
  return new LlamaRnProvider({
    modelPath,
    contextSize: capability.recommendedContextSize,
    nGpuLayers: capability.recommendedGpuLayers,
    nThreads: capability.recommendedThreads,
    useMlock: false,
  });
}

async function withInitTimeout<T>(
  promise: Promise<T>,
  attemptId: number,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          initCanceled = true;
          reject(new LocalLLMProviderError(`${label} timed out after ${timeoutMs}ms`, 'timeout'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (!isInitAttemptCurrent(attemptId)) {
      initCanceled = true;
    }
  }
}

async function resolveModelPath(): Promise<string | null> {
  if (Platform.OS === 'android') {
    setState({ status: 'checking-storage', error: null });
  }
  try {
    const path = await getInstalledModelPath();
    if (path && Platform.OS === 'android') {
      setState({ status: 'copying' });
    }
    return path;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/storage/i.test(message)) {
      setState({
        status: 'insufficient-storage',
        error: message,
        fallbackActive: true,
      });
      return null;
    }
    throw error;
  }
}

async function handleCorruptModel(): Promise<string | null> {
  setState({ status: 'corrupted', fallbackActive: true });
  const recopied = await attemptModelRecopy();
  if (!recopied) return null;
  setState({ status: 'copying' });
  return resolveModelPath();
}

async function runInitialization(): Promise<LocalModelState> {
  const attemptId = ++initAttemptId;
  initCanceled = false;

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
    let modelPath = await resolveModelPath();
    if (!isInitAttemptCurrent(attemptId)) {
      await activeProvider?.unload().catch(() => undefined);
      activeProvider = null;
      return state;
    }

    if (!modelPath) {
      if (state.status === 'insufficient-storage') return state;
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

    let integrity = await verifyModelIntegrity({ path: modelPath });
    if (!integrity.ok) {
      const isCorrupt =
        integrity.ggufHeaderValid === false ||
        integrity.error?.includes('SHA-256') ||
        integrity.error?.includes('size mismatch') ||
        integrity.error?.includes('Invalid GGUF');
      if (isCorrupt) {
        modelPath = await handleCorruptModel();
        if (modelPath) {
          integrity = await verifyModelIntegrity({ path: modelPath, forceFull: true });
        }
      }
      if (!integrity.ok) {
        setState({
          status: isCorrupt ? 'corrupted' : 'failed',
          error: integrity.error ?? 'Model verification failed',
          loadedAt: null,
          fallbackActive: true,
        });
        return state;
      }
    }

    if (!isInitAttemptCurrent(attemptId)) {
      return state;
    }

    setState({ status: 'loading', error: null });
    const started = Date.now();

    if (activeProvider) {
      await activeProvider.unload().catch(() => undefined);
      activeProvider = null;
    }

    if (!modelPath) {
      setState({
        status: 'unavailable',
        modelPath: null,
        fallbackActive: true,
      });
      return state;
    }

    const provider = await createProvider(modelPath);
    try {
      await withInitTimeout(
        provider.initialize(),
        attemptId,
        LOCAL_MODEL_CONFIG.initTimeoutMs,
        'Model initialization',
      );
    } catch (error) {
      await provider.unload().catch(() => undefined);
      throw error;
    }

    if (!isInitAttemptCurrent(attemptId)) {
      await provider.unload().catch(() => undefined);
      activeProvider = null;
      return state;
    }

    activeProvider = provider;
    const maybeSized = provider as unknown as { getContextSize?: () => number };
    const providerContextSize =
      typeof maybeSized.getContextSize === 'function'
        ? maybeSized.getContextSize()
        : capability.recommendedContextSize;
    setState({
      status: 'ready',
      loadedAt: Date.now(),
      initDurationMs: Date.now() - started,
      error: null,
      providerId: provider.id,
      contextSize: providerContextSize,
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
      status: error instanceof LocalLLMProviderError && error.code === 'timeout' ? 'failed' : 'failed',
      error: message,
      loadedAt: null,
      providerId: null,
      fallbackActive: true,
    });
    return state;
  }
}

export async function initializeModel(): Promise<LocalModelState> {
  if (state.status === 'ready' && activeProvider?.isReady()) {
    return state;
  }
  if (initPromise) return initPromise;

  initPromise = runInitialization().finally(() => {
    initPromise = null;
  });
  return initPromise;
}

export async function initializeModelManager(): Promise<LocalModelState> {
  return initializeModel();
}

export async function retryModelInitialization(): Promise<LocalModelState> {
  initAttemptId += 1;
  initCanceled = true;
  initPromise = null;
  if (activeProvider) {
    await activeProvider.unload().catch(() => undefined);
    activeProvider = null;
  }
  // User-triggered retry: clear preparation backoff so one controlled attempt may run.
  await requestUserModelPreparationRetry().catch(() => undefined);
  if (state.status === 'failed' || state.status === 'corrupted') {
    await clearStoredVerification().catch(() => undefined);
  }
  setState({
    status: 'idle',
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

  const generationId = ++activeGenerationId;
  setState({ status: 'generating', error: null });
  const started = Date.now();

  const guardedOnToken: TokenCallback | undefined = onToken
    ? (token) => {
        if (generationId !== activeGenerationId) return;
        onToken(token);
      }
    : undefined;

  try {
    const text = await activeProvider.chat(messages, options, guardedOnToken);
    if (generationId !== activeGenerationId) {
      throw new LocalLLMProviderError('Generation cancelled', 'cancelled');
    }
    const durationSec = Math.max(0.001, (Date.now() - started) / 1000);
    const approxTokens = Math.max(1, Math.ceil(text.length / 4));
    setState({
      status: 'ready',
      lastTokensPerSecond: approxTokens / durationSec,
    });
    return text;
  } catch (error) {
    if (generationId === activeGenerationId) {
      setState({
        status: activeProvider.isReady() ? 'ready' : 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

export async function cancelGeneration(): Promise<void> {
  activeGenerationId += 1;
  if (activeProvider) {
    await activeProvider.cancelGeneration();
  }
}

export async function unloadModel(): Promise<void> {
  initAttemptId += 1;
  initCanceled = true;
  initPromise = null;
  activeGenerationId += 1;
  if (activeProvider) {
    await activeProvider.unload().catch(() => undefined);
    activeProvider = null;
  }
  setState({
    status: state.modelPath ? 'idle' : 'unavailable',
    loadedAt: null,
    providerId: null,
    error: null,
    fallbackActive: true,
  });
}

export function markModelLoading(): void {
  if (state.status === 'unavailable') return;
  setState({ status: 'loading', error: null });
}

export function markModelReady(): void {
  setState({ status: 'ready', loadedAt: Date.now(), error: null, fallbackActive: false });
}

export function markModelError(error: string): void {
  setState({ status: 'failed', error, loadedAt: null, fallbackActive: true });
}

export function markModelReleased(): void {
  void unloadModel();
}

export function __resetModelManagerForTests(): void {
  state = { ...INITIAL_STATE };
  initPromise = null;
  activeProvider = null;
  providerFactory = null;
  initAttemptId = 0;
  initCanceled = false;
  activeGenerationId = 0;
  listeners.clear();
}

export { LOCAL_MODEL_CONFIG };
