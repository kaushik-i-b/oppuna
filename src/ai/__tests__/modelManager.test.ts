import * as FileSystem from 'expo-file-system/legacy';

import {
  __resetModelManagerForTests,
  getModelState,
  initializeModelManager,
  installModelFromUri,
  removeInstalledModel,
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
});

describe('installModelFromUri', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
    jest.clearAllMocks();
  });

  it('rejects when the source file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path === 'file:///picked/llama.gguf') return { exists: false };
      return { exists: true, isDirectory: true };
    });

    await expect(
      installModelFromUri('file:///picked/llama.gguf', { filename: 'llama.gguf' }),
    ).rejects.toThrow(/could not be read/i);
  });

  it('copies the picked file into the models directory and updates state', async () => {
    const files: Record<string, { exists: boolean; isDirectory?: boolean; size?: number }> = {
      'file:///picked/llama-3.2-1b-q4.gguf': { exists: true, isDirectory: false, size: 700 },
    };
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (files[path]) return files[path];
      if (path.endsWith('/models/')) return { exists: true, isDirectory: true };
      if (path.endsWith('.gguf')) {
        return files[path] ?? { exists: false };
      }
      return { exists: false };
    });
    (FileSystem.copyAsync as jest.Mock).mockImplementation(async ({ to }: { to: string }) => {
      files[to] = { exists: true, isDirectory: false, size: 700 };
    });

    const outcome = await installModelFromUri(
      'file:///picked/llama-3.2-1b-q4.gguf',
      { filename: 'llama-3.2-1b-q4.gguf' },
    );

    expect(outcome.modelId).toBe('llama-3.2-1b-q4');
    expect(outcome.installedPath).toContain('llama-3.2-1b-q4.gguf');
    expect(outcome.sizeBytes).toBe(700);
    expect(FileSystem.copyAsync).toHaveBeenCalledTimes(1);

    const state = getModelState();
    expect(state.status).toBe('idle');
    expect(state.modelId).toBe('llama-3.2-1b-q4');
    expect(state.modelPath).toContain('llama-3.2-1b-q4.gguf');
  });

  it('sanitizes the filename and ensures a .gguf extension', async () => {
    const files: Record<string, { exists: boolean; isDirectory?: boolean; size?: number }> = {
      'content://provider/temp-model': { exists: true, isDirectory: false, size: 42 },
    };
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (files[path]) return files[path];
      return { exists: false };
    });
    (FileSystem.copyAsync as jest.Mock).mockImplementation(
      async ({ to }: { to: string }) => {
        files[to] = { exists: true, isDirectory: false, size: 42 };
      },
    );

    const outcome = await installModelFromUri('content://provider/temp-model', {
      filename: 'weird name (1).bin',
    });

    expect(outcome.installedPath).toMatch(/weird_name__1_\.bin\.gguf$/);
    expect(outcome.modelId).toBe('weird_name__1_.bin');
  });

  it('records an error state when the copy fails', async () => {
    const files: Record<string, { exists: boolean; isDirectory?: boolean; size?: number }> = {
      'file:///picked/model.gguf': { exists: true, isDirectory: false, size: 100 },
    };
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (files[path]) return files[path];
      return { exists: false };
    });
    (FileSystem.copyAsync as jest.Mock).mockRejectedValue(new Error('disk full'));

    await expect(
      installModelFromUri('file:///picked/model.gguf', { filename: 'model.gguf' }),
    ).rejects.toThrow(/disk full/);

    expect(getModelState().status).toBe('error');
  });
});

describe('removeInstalledModel', () => {
  beforeEach(() => {
    __resetModelManagerForTests();
    jest.clearAllMocks();
  });

  it('deletes the model file and clears manager state', async () => {
    const files: Record<string, { exists: boolean; isDirectory?: boolean; size?: number }> = {
      'file:///picked/llama.gguf': { exists: true, isDirectory: false, size: 500 },
    };
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (files[path]) return files[path];
      return { exists: false };
    });
    (FileSystem.copyAsync as jest.Mock).mockImplementation(
      async ({ to }: { to: string }) => {
        files[to] = { exists: true, isDirectory: false, size: 500 };
      },
    );
    (FileSystem.deleteAsync as jest.Mock).mockImplementation(async (path: string) => {
      delete files[path];
    });

    await installModelFromUri('file:///picked/llama.gguf', {
      filename: 'llama.gguf',
    });
    expect(getModelState().modelPath).toBeTruthy();

    await removeInstalledModel();

    expect(FileSystem.deleteAsync).toHaveBeenCalled();
    expect(getModelState().status).toBe('unavailable');
    expect(getModelState().modelPath).toBeNull();
    expect(getModelState().modelId).toBeNull();
  });

  it('is a no-op when there is no installed model', async () => {
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    await removeInstalledModel();
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    expect(getModelState().status).toBe('unavailable');
  });
});
