import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import {
  clearStoredVerification,
  getModelMetadata,
  isModelAvailable,
  verifyModelIntegrity,
} from '@/services/modelAssetService';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';

describe('modelAssetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('exposes centralized model metadata', () => {
    const meta = getModelMetadata();
    expect(meta.modelName).toBe(LOCAL_MODEL_CONFIG.id);
    expect(meta.fileName).toBe(LOCAL_MODEL_CONFIG.fileName);
    expect(meta.assetPackName).toBe('ai_model_asset_pack');
  });

  it('reports unavailable when no file exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    expect(await isModelAvailable()).toBe(false);
  });

  it('rejects suspiciously small model files', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 128,
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('R0dVRg==');

    const result = await verifyModelIntegrity({ path: '/tmp/model.gguf' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/small/i);
  });

  it('accepts a plausible file and stores trusted verification', async () => {
    const expectedSize = LOCAL_MODEL_CONFIG.expectedSize || 5_000_000;
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: expectedSize,
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('R0dVRg==');

    const first = await verifyModelIntegrity({ path: '/tmp/model.gguf', forceFull: true });
    expect(first.ok).toBe(true);
    expect(first.fullVerification).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        schemaVersion: 1,
        modelId: LOCAL_MODEL_CONFIG.id,
        modelVersion: LOCAL_MODEL_CONFIG.version,
        appVersion: '2.0.0',
        expectedSize,
        expectedSha256: LOCAL_MODEL_CONFIG.sha256,
        path: '/tmp/model.gguf',
        size: expectedSize,
        sha256: LOCAL_MODEL_CONFIG.sha256 || null,
        verifiedAt: Date.now(),
      }),
    );

    const second = await verifyModelIntegrity({ path: '/tmp/model.gguf' });
    expect(second.ok).toBe(true);
    expect(second.fullVerification).toBe(false);
  });

  it('can clear stored verification', async () => {
    await clearStoredVerification();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('rejects files with an invalid GGUF header', async () => {
    const expectedSize = LOCAL_MODEL_CONFIG.expectedSize;
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: expectedSize,
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('AAAA');

    const result = await verifyModelIntegrity({ path: '/tmp/model.gguf', forceFull: true });
    expect(result.ok).toBe(false);
    expect(result.ggufHeaderValid).toBe(false);
    expect(result.error).toMatch(/GGUF/i);
  });
});
