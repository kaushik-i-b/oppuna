import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  attemptModelRecopy,
  clearPreparationFailureState,
  clearRecopyAttemptCounter,
  clearStoredVerification,
  getPreparationFailureState,
  getRecopyAttemptCount,
  hasTrustedVerificationForPath,
  MAX_AUTO_PREP_FAILURES,
  MAX_RECOPY_ATTEMPTS,
  prepareBundledModel,
  recordPreparationFailure,
  requestUserModelPreparationRetry,
  requiredPrivateModelStorageBytes,
  shouldSuppressAutomaticPreparation,
} from '@/services/modelAssetService';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { APP } from '@/constants/app';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    OppunaModelAsset: {
      prepareLocalModel: jest.fn(),
      deletePrivateModel: jest.fn(async () => true),
    },
  },
}));

const { NativeModules } = jest.requireMock('react-native');

function mockStore() {
  const store: Record<string, string> = {};
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => store[key] ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    store[key] = value;
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    delete store[key];
  });
  return store;
}

describe('model recopy counter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockStore();
  });

  it('allows exactly one automatic recopy then stops', async () => {
    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue(null);

    const first = await attemptModelRecopy();
    expect(first).toBe(false);
    expect(await getRecopyAttemptCount()).toBe(1);

    const second = await attemptModelRecopy();
    expect(second).toBe(false);
    expect(await getRecopyAttemptCount()).toBe(1);
    expect(MAX_RECOPY_ATTEMPTS).toBe(1);
  });

  it('resets counter only after verified successful prepare', async () => {
    const store = mockStore();
    store['oppuna.localModel.recopyAttempts.v1'] = '1';

    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path: '/data/user/0/com.oppuna.care/files/ai-model/model.gguf',
      copied: true,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
    });

    const prepared = await prepareBundledModel({ forceRecopy: true });
    expect(prepared?.verified).toBe(true);
    expect(await getRecopyAttemptCount()).toBe(0);
  });

  it('clearStoredVerification does not reset recopy counter', async () => {
    const removed: string[] = [];
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      removed.push(key);
    });
    await clearStoredVerification();
    expect(removed).not.toContain('oppuna.localModel.recopyAttempts.v1');
    await clearRecopyAttemptCounter();
    expect(removed).toContain('oppuna.localModel.recopyAttempts.v1');
  });
});

describe('trusted verification / SHA skip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockStore();
  });

  it('first preparation requests full SHA (skipFullSha=false)', async () => {
    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      copied: true,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
      shaSkipped: false,
    });

    await prepareBundledModel();
    expect(NativeModules.OppunaModelAsset.prepareLocalModel).toHaveBeenCalledWith(
      LOCAL_MODEL_CONFIG.fileName,
      LOCAL_MODEL_CONFIG.expectedSize,
      LOCAL_MODEL_CONFIG.sha256,
      false,
      false,
    );
  });

  it('healthy verified restart skips full SHA', async () => {
    const path = '/data/ai-model/model.gguf';
    const store = mockStore();
    store['oppuna.localModel.verification.v1'] = JSON.stringify({
      schemaVersion: 1,
      modelId: LOCAL_MODEL_CONFIG.id,
      modelVersion: LOCAL_MODEL_CONFIG.version,
      appVersion: APP.version,
      expectedSize: LOCAL_MODEL_CONFIG.expectedSize,
      expectedSha256: LOCAL_MODEL_CONFIG.sha256,
      path,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verifiedAt: Date.now(),
    });

    expect(await hasTrustedVerificationForPath(path)).toBe(true);

    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path,
      copied: false,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
      shaSkipped: true,
    });

    const prepared = await prepareBundledModel();
    expect(prepared?.shaSkipped).toBe(true);
    expect(NativeModules.OppunaModelAsset.prepareLocalModel.mock.calls[0][4]).toBe(true);
  });

  it('invalidates trusted verification when expected SHA changes', async () => {
    const path = '/data/ai-model/model.gguf';
    const store = mockStore();
    store['oppuna.localModel.verification.v1'] = JSON.stringify({
      schemaVersion: 1,
      modelId: LOCAL_MODEL_CONFIG.id,
      modelVersion: LOCAL_MODEL_CONFIG.version,
      appVersion: APP.version,
      expectedSize: LOCAL_MODEL_CONFIG.expectedSize,
      expectedSha256: '0'.repeat(64),
      path,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: '0'.repeat(64),
      verifiedAt: Date.now(),
    });
    expect(await hasTrustedVerificationForPath(path)).toBe(false);
  });
});

describe('preparation failure backoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockStore();
  });

  it('suppresses automatic preparation after persistent failures', async () => {
    await recordPreparationFailure('prepare_error');
    await recordPreparationFailure('prepare_error');
    expect(MAX_AUTO_PREP_FAILURES).toBe(2);
    expect(await shouldSuppressAutomaticPreparation()).toBe(true);

    const result = await prepareBundledModel();
    expect(result?.suppressed).toBe(true);
    expect(NativeModules.OppunaModelAsset.prepareLocalModel).not.toHaveBeenCalled();
  });

  it('user-triggered retry clears backoff and allows one attempt', async () => {
    await recordPreparationFailure('prepare_error');
    await recordPreparationFailure('prepare_error');
    expect(await shouldSuppressAutomaticPreparation()).toBe(true);

    await requestUserModelPreparationRetry();
    expect(await shouldSuppressAutomaticPreparation()).toBe(false);
    expect(await getPreparationFailureState()).toBeNull();

    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      copied: true,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
    });
    const prepared = await prepareBundledModel({ userInitiated: true });
    expect(prepared?.verified).toBe(true);
  });

  it('resets backoff when android versionCode changes', async () => {
    const store = mockStore();
    store['oppuna.localModel.prepFailure.v1'] = JSON.stringify({
      consecutiveFailures: 2,
      lastCategory: 'prepare_error',
      lastFailureAt: Date.now(),
      modelId: LOCAL_MODEL_CONFIG.id,
      modelVersion: LOCAL_MODEL_CONFIG.version,
      appVersion: APP.version,
      appVersionCode: APP.androidVersionCode - 1,
    });
    expect(await shouldSuppressAutomaticPreparation()).toBe(false);
  });

  it('successful prepare clears failure state', async () => {
    await recordPreparationFailure('prepare_error');
    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path: '/data/ai-model/model.gguf',
      copied: true,
      size: LOCAL_MODEL_CONFIG.expectedSize,
      sha256: LOCAL_MODEL_CONFIG.sha256,
      verified: true,
    });
    await prepareBundledModel({ forceRecopy: true });
    expect(await getPreparationFailureState()).toBeNull();
    await clearPreparationFailureState();
  });
});

describe('storage headroom formula', () => {
  it('requires expectedSize + headroom, not 2× model size', () => {
    const required = requiredPrivateModelStorageBytes();
    expect(required).toBe(
      LOCAL_MODEL_CONFIG.expectedSize + LOCAL_MODEL_CONFIG.storageHeadroomBytes,
    );
    expect(required).toBeLessThan(LOCAL_MODEL_CONFIG.expectedSize * 2);
    expect(LOCAL_MODEL_CONFIG.expectedSize).toBe(986048768);
  });
});
