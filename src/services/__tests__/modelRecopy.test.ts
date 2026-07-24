import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  attemptModelRecopy,
  clearRecopyAttemptCounter,
  clearStoredVerification,
  getRecopyAttemptCount,
  MAX_RECOPY_ATTEMPTS,
  prepareBundledModel,
  requiredPrivateModelStorageBytes,
} from '@/services/modelAssetService';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';

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

describe('model recopy counter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    Platform.OS = 'android';
  });

  it('allows exactly one automatic recopy then stops', async () => {
    const store: Record<string, string> = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => store[key] ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      store[key] = value;
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      delete store[key];
    });

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
    const store: Record<string, string> = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => store[key] ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      store[key] = value;
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      delete store[key];
    });

    store['oppuna.localModel.recopyAttempts.v1'] = '1';

    NativeModules.OppunaModelAsset.prepareLocalModel.mockResolvedValue({
      path: '/data/user/0/com.oppuna.app/files/ai-model/model.gguf',
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

describe('storage headroom formula', () => {
  it('requires expectedSize + headroom, not 2× model size', () => {
    const required = requiredPrivateModelStorageBytes();
    expect(required).toBe(
      LOCAL_MODEL_CONFIG.expectedSize + LOCAL_MODEL_CONFIG.storageHeadroomBytes,
    );
    expect(required).toBeLessThan(LOCAL_MODEL_CONFIG.expectedSize * 2);
    expect(LOCAL_MODEL_CONFIG.expectedSize).toBe(806058496);
  });
});
