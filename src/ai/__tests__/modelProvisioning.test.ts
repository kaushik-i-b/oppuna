import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

import {
  __resetModelProvisioningForTests,
  provisionBundledModel,
} from '@/ai/modelProvisioning';

const mockDownloadAsync = jest.fn(async () => undefined);
let mockLocalUri: string | null = 'file:///bundle/oppuna-model.gguf';

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: mockDownloadAsync,
      get localUri() {
        return mockLocalUri;
      },
      uri: 'asset://oppuna-model.gguf',
    })),
  },
}));

// Controllable stand-in for the bundled model reference.
jest.mock('@/ai/bundledModel', () => ({
  get BUNDLED_MODEL() {
    return (globalThis as { __BUNDLED_MODEL__?: number | null }).__BUNDLED_MODEL__ ?? null;
  },
}));

function setBundledModel(value: number | null): void {
  (globalThis as { __BUNDLED_MODEL__?: number | null }).__BUNDLED_MODEL__ = value;
}

describe('modelProvisioning', () => {
  beforeEach(() => {
    __resetModelProvisioningForTests();
    jest.clearAllMocks();
    mockLocalUri = 'file:///bundle/oppuna-model.gguf';
    setBundledModel(null);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
  });

  it('no-ops when no model is bundled with the app', async () => {
    setBundledModel(null);

    const result = await provisionBundledModel();

    expect(result.outcome).toBe('no-bundled-model');
    expect(result.modelPath).toBeNull();
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });

  it('stages the bundled model into local storage on first launch', async () => {
    setBundledModel(42);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const result = await provisionBundledModel();

    expect(Asset.fromModule).toHaveBeenCalledWith(42);
    expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///bundle/oppuna-model.gguf',
      to: expect.stringContaining('oppuna-model.gguf'),
    });
    expect(result.outcome).toBe('staged');
    expect(result.modelPath).toContain('oppuna-model.gguf');
  });

  it('skips the copy when the model is already staged', async () => {
    setBundledModel(42);
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
      exists: path.endsWith('oppuna-model.gguf'),
    }));

    const result = await provisionBundledModel();

    expect(result.outcome).toBe('already-present');
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });

  it('degrades gracefully to an error outcome when staging fails', async () => {
    setBundledModel(42);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    mockDownloadAsync.mockRejectedValueOnce(new Error('unpack failed'));

    const result = await provisionBundledModel();

    expect(result.outcome).toBe('error');
    expect(result.modelPath).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('memoizes so repeated calls within a session stage only once', async () => {
    setBundledModel(42);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    await provisionBundledModel();
    await provisionBundledModel();

    expect(mockDownloadAsync).toHaveBeenCalledTimes(1);
  });
});
