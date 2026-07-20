import * as FileSystem from 'expo-file-system/legacy';

import {
  __resetModelManagerForTests,
  getModelState,
  importModelFromUri,
  initializeModelManager,
  removeModel,
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

  it('imports a user-picked GGUF into the app sandbox and activates it', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['old-model.gguf']);

    const result = await importModelFromUri('file:///picked/llama-3.2-1b-q4.gguf', 'llama-3.2-1b-q4.gguf');

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining('old-model.gguf'),
      { idempotent: true },
    );
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///picked/llama-3.2-1b-q4.gguf',
      to: expect.stringContaining('llama-3.2-1b-q4.gguf'),
    });
    expect(result.status).toBe('idle');
    expect(result.modelId).toBe('llama-3.2-1b-q4');
  });

  it('reports an error state when the copy fails', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([]);
    (FileSystem.copyAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

    const result = await importModelFromUri('file:///picked/model.gguf');

    expect(result.status).toBe('error');
    expect(result.error).toContain('disk full');
    expect(result.modelPath).toBeNull();
  });

  it('removes the active model and returns to unavailable', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(['model.gguf']);

    await importModelFromUri('file:///picked/model.gguf', 'model.gguf');
    const result = await removeModel();

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining('model.gguf'),
      { idempotent: true },
    );
    expect(result.status).toBe('unavailable');
    expect(result.modelPath).toBeNull();
    expect(result.modelId).toBeNull();
  });
});
