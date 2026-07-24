import * as FileSystem from 'expo-file-system/legacy';

import {
  __resetModelManagerForTests,
  getModelState,
  getModelStatus,
  initializeModel,
  isModelReady,
  retryModelInitialization,
  setProviderFactoryForTests,
  generate,
  cancelGeneration,
  unloadModel,
} from '@/ai/modelManager';
import { FakeLocalLLMProvider } from '@/ai/providers';
import * as modelAssetService from '@/services/modelAssetService';

jest.mock('@/services/modelAssetService', () => {
  const actual = jest.requireActual('@/services/modelAssetService');
  const { LOCAL_MODEL_CONFIG } = jest.requireActual('@/config/localModel');
  return {
    ...actual,
    getInstalledModelPath: jest.fn(),
    verifyModelIntegrity: jest.fn(),
    clearStoredVerification: jest.fn(async () => undefined),
    getDevModelsDirectory: jest.fn(() => 'file:///mock-documents/models/'),
    getModelMetadata: jest.fn(() => ({
      modelName: LOCAL_MODEL_CONFIG.id,
      version: LOCAL_MODEL_CONFIG.version,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      expectedSize: LOCAL_MODEL_CONFIG.expectedSize,
      fileName: LOCAL_MODEL_CONFIG.fileName,
      assetPackName: LOCAL_MODEL_CONFIG.assetPackName,
    })),
  };
});

describe('modelManager lifecycle', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
  });

  it('reports unavailable when no model is installed', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(null);

    const result = await initializeModel();

    expect(result.status).toBe('unavailable');
    expect(getModelStatus()).toBe('unavailable');
    expect(isModelReady()).toBe(false);
  });

  it('loads a provider after locate + verify', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: true,
      path: '/data/model.gguf',
      size: 5_000_000,
      sha256: null,
      fullVerification: true,
      error: null,
    });
    setProviderFactoryForTests(() => new FakeLocalLLMProvider({ reply: 'hello' }));

    const result = await initializeModel();

    expect(result.status).toBe('ready');
    expect(isModelReady()).toBe(true);
    expect(getModelState().providerId).toBe('fake');
  });

  it('retries after a failed initialization (no cached rejected promise)', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: true,
      path: '/data/model.gguf',
      size: 5_000_000,
      sha256: null,
      fullVerification: true,
      error: null,
    });

    let attempts = 0;
    setProviderFactoryForTests(() => {
      attempts += 1;
      return new FakeLocalLLMProvider({
        initializeOk: attempts > 1,
        reply: 'ok',
      });
    });

    const first = await initializeModel();
    expect(first.status).toBe('failed');

    const second = await retryModelInitialization();
    expect(second.status).toBe('ready');
    expect(attempts).toBe(2);
  });

  it('marks failed when integrity verification fails', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: false,
      path: '/data/model.gguf',
      size: 10,
      sha256: null,
      fullVerification: false,
      error: 'Model file is missing or suspiciously small.',
    });

    const result = await initializeModel();
    expect(result.status).toBe('corrupted');
    expect(result.error).toMatch(/suspiciously small/i);
  });

  it('generates and prevents overlapping calls via the provider', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: true,
      path: '/data/model.gguf',
      size: 5_000_000,
      sha256: null,
      fullVerification: true,
      error: null,
    });
    setProviderFactoryForTests(
      () => new FakeLocalLLMProvider({ reply: 'streamed reply', latencyMs: 30 }),
    );

    await initializeModel();
    const tokens: string[] = [];
    const text = await generate(
      [{ role: 'user', content: 'hi' }],
      { maxTokens: 32 },
      (token) => tokens.push(token),
    );
    expect(text).toBe('streamed reply');
    expect(tokens.join('')).toBe(text);
    expect(getModelStatus()).toBe('ready');
  });

  it('supports cancelGeneration without crashing', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: true,
      path: '/data/model.gguf',
      size: 5_000_000,
      sha256: null,
      fullVerification: true,
      error: null,
    });
    setProviderFactoryForTests(() => new FakeLocalLLMProvider({ latencyMs: 100 }));
    await initializeModel();

    const pending = generate([{ role: 'user', content: 'hi' }]);
    await cancelGeneration();
    await expect(pending).rejects.toBeDefined();
  });

  it('unloads the model', async () => {
    (modelAssetService.getInstalledModelPath as jest.Mock).mockResolvedValue(
      '/data/model.gguf',
    );
    (modelAssetService.verifyModelIntegrity as jest.Mock).mockResolvedValue({
      ok: true,
      path: '/data/model.gguf',
      size: 5_000_000,
      sha256: null,
      fullVerification: true,
      error: null,
    });
    setProviderFactoryForTests(() => new FakeLocalLLMProvider());
    await initializeModel();
    await unloadModel();
    expect(getModelStatus()).toBe('uninitialized');
    expect(isModelReady()).toBe(false);
  });
});
