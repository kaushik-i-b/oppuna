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
