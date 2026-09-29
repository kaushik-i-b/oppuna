import { NativeModules, Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { retryModelInitialization } from '@/ai/modelManager';
import {
  deleteCorruptPrivateModel,
  prepareBundledModel,
  recordVerifiedDownload,
} from '@/services/modelAssetService';
import {
  __resetModelDownloadForTests,
  downloadOnDeviceModel,
  getModelDownloadSnapshot,
  modelDownloadErrorMessage,
} from '@/services/modelDownloadService';

jest.mock('@/ai/modelManager', () => ({
  retryModelInitialization: jest.fn(async () => ({ status: 'ready' })),
  unloadModel: jest.fn(async () => undefined),
}));

jest.mock('@/services/modelAssetService', () => ({
  prepareBundledModel: jest.fn(),
  recordVerifiedDownload: jest.fn(async () => undefined),
  clearStoredVerification: jest.fn(async () => undefined),
  deleteCorruptPrivateModel: jest.fn(async () => undefined),
}));

function codedError(code: string, message: string): Error {
  const error = new Error(message);
  (error as Error & { code?: string }).code = code;
  return error;
}

describe('modelDownloadService', () => {
  const originalOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetModelDownloadForTests();
    Platform.OS = 'android';
    NativeModules.OppunaModelAsset = {
      fetchOnDemandPack: jest.fn(),
      downloadPinnedModel: jest.fn(),
      cancelModelDownload: jest.fn(async () => true),
      removeOnDemandPack: jest.fn(async () => true),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    };
  });

  afterEach(() => {
    Platform.OS = originalOs;
  });

  it('uses an already installed model without downloading', async () => {
    (prepareBundledModel as jest.Mock).mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      verified: true,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
    });

    await expect(downloadOnDeviceModel()).resolves.toBe('/data/ai-model/model.gguf');
    expect(NativeModules.OppunaModelAsset.fetchOnDemandPack).not.toHaveBeenCalled();
    expect(NativeModules.OppunaModelAsset.downloadPinnedModel).not.toHaveBeenCalled();
    expect(retryModelInitialization).toHaveBeenCalled();
  });

  it('downloads the pinned file when Play delivery is unavailable', async () => {
    (prepareBundledModel as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    NativeModules.OppunaModelAsset.fetchOnDemandPack.mockRejectedValue(
      codedError('PLAY_UNAVAILABLE', 'not from Play'),
    );
    NativeModules.OppunaModelAsset.downloadPinnedModel.mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
    });

    await expect(downloadOnDeviceModel()).resolves.toBe('/data/ai-model/model.gguf');
    expect(NativeModules.OppunaModelAsset.downloadPinnedModel).toHaveBeenCalledWith(
      LOCAL_MODEL_CONFIG.downloadUrl,
      LOCAL_MODEL_CONFIG.expectedSize,
      LOCAL_MODEL_CONFIG.sha256,
    );
    expect(recordVerifiedDownload).toHaveBeenCalledWith({
      path: '/data/ai-model/model.gguf',
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
    });
  });

  it('does not fall through to a direct download after cancel or storage failure', async () => {
    (prepareBundledModel as jest.Mock).mockResolvedValue(null);
    NativeModules.OppunaModelAsset.fetchOnDemandPack.mockRejectedValue(
      codedError('DOWNLOAD_CANCELED', 'canceled'),
    );
    await expect(downloadOnDeviceModel()).resolves.toBeNull();
    expect(NativeModules.OppunaModelAsset.downloadPinnedModel).not.toHaveBeenCalled();

    __resetModelDownloadForTests();
    NativeModules.OppunaModelAsset.fetchOnDemandPack.mockRejectedValue(
      codedError('INSUFFICIENT_STORAGE', 'full'),
    );
    await expect(downloadOnDeviceModel()).rejects.toThrow(/free space/i);
    expect(NativeModules.OppunaModelAsset.downloadPinnedModel).not.toHaveBeenCalled();
  });

  it('deletes a download whose hash does not match the pinned model', async () => {
    (prepareBundledModel as jest.Mock).mockResolvedValue(null);
    NativeModules.OppunaModelAsset.fetchOnDemandPack.mockRejectedValue(
      codedError('PLAY_UNAVAILABLE', 'not from Play'),
    );
    NativeModules.OppunaModelAsset.downloadPinnedModel.mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      size: 12,
      sha256: 'a'.repeat(64),
      verified: false,
    });
    (recordVerifiedDownload as jest.Mock).mockRejectedValue(
      new Error('Downloaded model hash does not match the pinned model.'),
    );

    await expect(downloadOnDeviceModel()).rejects.toThrow(/guided replies/i);
    expect(deleteCorruptPrivateModel).toHaveBeenCalled();
    expect(retryModelInitialization).not.toHaveBeenCalled();
    expect(getModelDownloadSnapshot().phase).toBe('error');
  });

  it('explains a build that cannot open a network download', () => {
    expect(modelDownloadErrorMessage(codedError('NETWORK_BLOCKED', 'blocked'))).toMatch(
      /Google Play/i,
    );
  });
});
