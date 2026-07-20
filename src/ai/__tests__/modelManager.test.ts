import * as FileSystem from 'expo-file-system/legacy';

import {
  __resetModelManagerForTests,
  getModelState,
  initializeModelManager,
  subscribeToModelState,
} from '@/ai/modelManager';

describe('modelManager', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
    (FileSystem as unknown as { bundleDirectory?: string | null }).bundleDirectory = null;
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

  it('stages a bundled GGUF model into private storage', async () => {
    (FileSystem as unknown as { bundleDirectory?: string | null }).bundleDirectory = 'file:///bundle/';
    let staged = false;
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => ({
      exists:
        path === 'file:///bundle/assets/models/oppuna-model.gguf' ||
        (staged && path === 'file:///mock-documents/models/oppuna-model.gguf'),
    }));
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.copyAsync as jest.Mock).mockImplementation(async () => {
      staged = true;
    });

    const result = await initializeModelManager();

    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///bundle/assets/models/oppuna-model.gguf',
      to: 'file:///mock-documents/models/oppuna-model.gguf',
    });
    expect(result.status).toBe('idle');
    expect(result.modelPath).toBe('file:///mock-documents/models/oppuna-model.gguf');
    expect(result.modelId).toBe('oppuna-model');
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
