import { initLlama } from 'llama.rn';

import { LlamaRnProvider } from '@/ai/providers/LlamaRnProvider';
import { FakeLocalLLMProvider } from '@/ai/providers/FakeLocalLLMProvider';

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
}));

const initLlamaMock = initLlama as jest.MockedFunction<typeof initLlama>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('LlamaRnProvider initialization lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shares a single native load across concurrent initialize calls', async () => {
    const load = deferred<{ release: jest.Mock; gpu: boolean }>();
    initLlamaMock.mockReturnValueOnce(load.promise as never);

    const provider = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const a = provider.initialize();
    const b = provider.initialize();
    const c = provider.initialize();

    expect(initLlamaMock).toHaveBeenCalledTimes(1);

    load.resolve({ release: jest.fn(async () => undefined), gpu: false });
    await Promise.all([a, b, c]);
    expect(provider.isReady()).toBe(true);
  });

  it('releases a late native context after unload/cancel and does not become ready', async () => {
    const load = deferred<{ release: jest.Mock; gpu: boolean }>();
    const release = jest.fn(async () => undefined);
    initLlamaMock.mockReturnValueOnce(load.promise as never);

    const provider = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const pending = provider.initialize();

    await provider.unload();
    load.resolve({ release, gpu: false });

    await expect(pending).rejects.toBeDefined();
    expect(release).toHaveBeenCalled();
    expect(provider.isReady()).toBe(false);
    expect(provider.getStatus()).toBe('unloaded');
  });
});

describe('FakeLocalLLMProvider single-flight + stale init', () => {
  it('starts only one initialize load for concurrent callers', async () => {
    const provider = new FakeLocalLLMProvider({ initLatencyMs: 20 });
    await Promise.all([provider.initialize(), provider.initialize(), provider.initialize()]);
    expect(provider.initializeStarts).toBe(1);
    expect(provider.isReady()).toBe(true);
  });

  it('ignores late completion after unload', async () => {
    const gate = deferred<void>();
    const provider = new FakeLocalLLMProvider({
      deferInitialize: { promise: gate.promise },
    });
    const pending = provider.initialize();
    await provider.unload();
    gate.resolve();
    await expect(pending).rejects.toBeDefined();
    expect(provider.staleReleases).toBe(1);
    expect(provider.isReady()).toBe(false);
  });
});
