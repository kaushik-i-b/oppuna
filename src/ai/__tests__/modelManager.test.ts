import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

import {
  __resetModelManagerForTests,
  getModelState,
  initializeModelManager,
  registerBundledModelAsset,
  subscribeToModelState,
} from '@/ai/modelManager';

describe('modelManager', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
    jest.clearAllMocks();
  });

  it('reports unavailable when no GGUF model is in local storage', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const result = await initializeModelManager();

    expect(result.status).toBe('unavailable');
    expect(result.modelPath).toBeNull();
  });

  it('locates the default model filename in local storage', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
      exists: path.endsWith('oppuna-model.gguf'),
    }));

    const result = await initializeModelManager();

    expect(result.status).toBe('idle');
    expect(result.modelPath).toContain('oppuna-model.gguf');
    expect(result.modelId).toBe('oppuna-model');
  });

  it('stages a registered bundled GGUF asset into local storage', async () => {
    let copied = false;
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
      exists: path.endsWith('/models/') ? true : copied && path.endsWith('oppuna-model.gguf'),
    }));
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.copyAsync as jest.Mock).mockImplementation(async () => {
      copied = true;
    });

    registerBundledModelAsset(42);
    const result = await initializeModelManager();

    expect(Asset.fromModule).toHaveBeenCalledWith(42);
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///mock-bundle/oppuna-model.gguf',
      to: 'file:///mock-documents/models/oppuna-model.gguf',
    });
    expect(result.status).toBe('idle');
    expect(result.modelPath).toContain('oppuna-model.gguf');
  });

  it('notifies subscribers when state changes', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);

    const states: string[] = [];
    const unsubscribe = subscribeToModelState((next) => states.push(next.status));

    await initializeModelManager();

    expect(states).toContain('checking');
    expect(getModelState().status).toBe('unavailable');
    unsubscribe();
  });
});
