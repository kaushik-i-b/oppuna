import { provisionBundledModel, type ProvisionFileSystem } from '@/ai/modelProvisioner';
import { getModelsDirectory } from '@/ai/modelManager';
import { LLM_CONFIG } from '@/constants/app';

function makeFileSystem(overrides: Partial<ProvisionFileSystem> = {}): {
  fs: ProvisionFileSystem;
  copyAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
} {
  const copyAsync = jest.fn(async () => undefined);
  const makeDirectoryAsync = jest.fn(async () => undefined);
  const fs: ProvisionFileSystem = {
    getInfoAsync: jest.fn(async () => ({ exists: false })),
    makeDirectoryAsync,
    copyAsync,
    ...overrides,
  };
  return { fs, copyAsync, makeDirectoryAsync };
}

const targetPath = `${getModelsDirectory()}${LLM_CONFIG.storageFilename}`;

describe('provisionBundledModel', () => {
  it('no-ops when no model is bundled', async () => {
    const { fs, copyAsync } = makeFileSystem();

    const result = await provisionBundledModel({
      resolveBundledAsset: () => null,
      fileSystem: fs,
      platformOS: 'android',
    });

    expect(result.outcome).toBe('no-bundled-model');
    expect(result.modelPath).toBeNull();
    expect(copyAsync).not.toHaveBeenCalled();
  });

  it('skips the copy when the model is already present (idempotent)', async () => {
    const { fs, copyAsync } = makeFileSystem({
      getInfoAsync: jest.fn(async () => ({ exists: true })),
    });

    const result = await provisionBundledModel({
      resolveBundledAsset: () => 42,
      fileSystem: fs,
      platformOS: 'ios',
    });

    expect(result.outcome).toBe('already-present');
    expect(result.modelPath).toBe(targetPath);
    expect(copyAsync).not.toHaveBeenCalled();
  });

  it('copies the bundled asset into local storage when missing', async () => {
    const { fs, copyAsync, makeDirectoryAsync } = makeFileSystem();

    const result = await provisionBundledModel({
      resolveBundledAsset: () => 7,
      loadAsset: async () => ({ localUri: 'file:///bundle/model.gguf' }),
      fileSystem: fs,
      platformOS: 'android',
    });

    expect(result.outcome).toBe('copied');
    expect(result.modelPath).toBe(targetPath);
    expect(makeDirectoryAsync).toHaveBeenCalled();
    expect(copyAsync).toHaveBeenCalledWith({
      from: 'file:///bundle/model.gguf',
      to: targetPath,
    });
  });

  it('reports failure (never throws) when the asset has no local URI', async () => {
    const { fs, copyAsync } = makeFileSystem();

    const result = await provisionBundledModel({
      resolveBundledAsset: () => 7,
      loadAsset: async () => ({ localUri: null }),
      fileSystem: fs,
      platformOS: 'android',
    });

    expect(result.outcome).toBe('failed');
    expect(copyAsync).not.toHaveBeenCalled();
  });

  it('reports failure (never throws) when the copy rejects', async () => {
    const { fs } = makeFileSystem({
      copyAsync: jest.fn(async () => {
        throw new Error('disk full');
      }),
    });

    const result = await provisionBundledModel({
      resolveBundledAsset: () => 7,
      loadAsset: async () => ({ localUri: 'file:///bundle/model.gguf' }),
      fileSystem: fs,
      platformOS: 'android',
    });

    expect(result.outcome).toBe('failed');
    expect(result.error).toContain('disk full');
  });

  it('is unsupported on web', async () => {
    const { fs, copyAsync } = makeFileSystem();

    const result = await provisionBundledModel({
      resolveBundledAsset: () => 7,
      fileSystem: fs,
      platformOS: 'web',
    });

    expect(result.outcome).toBe('unsupported-platform');
    expect(copyAsync).not.toHaveBeenCalled();
  });
});
