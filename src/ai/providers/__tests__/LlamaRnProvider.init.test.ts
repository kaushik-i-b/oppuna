import { initLlama } from 'llama.rn';

import {
  LlamaRnProvider,
  __getActiveNativeInitPromiseForTests,
  __getNativeInitStartsForTests,
  __resetNativeInitGateForTests,
} from '@/ai/providers/LlamaRnProvider';
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

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('LlamaRnProvider initialization lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetNativeInitGateForTests();
  });

  afterEach(async () => {
    __resetNativeInitGateForTests();
  });

  it('shares a single native load across concurrent initialize calls', async () => {
    const load = deferred<{ release: jest.Mock; gpu: boolean }>();
    initLlamaMock.mockReturnValueOnce(load.promise as never);

    const provider = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const a = provider.initialize();
    const b = provider.initialize();
    const c = provider.initialize();
    await flushMicrotasks();

    expect(initLlamaMock).toHaveBeenCalledTimes(1);
    expect(__getNativeInitStartsForTests()).toBe(1);

    load.resolve({ release: jest.fn(async () => undefined), gpu: false });
    await Promise.all([a, b, c]);
    expect(provider.isReady()).toBe(true);
  });

  it('does not start a second native init while a stale one is still unresolved', async () => {
    const first = deferred<{ release: jest.Mock; gpu: boolean }>();
    const second = deferred<{ release: jest.Mock; gpu: boolean }>();
    initLlamaMock
      .mockReturnValueOnce(first.promise as never)
      .mockReturnValueOnce(second.promise as never);

    const providerA = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const pendingA = providerA.initialize();
    await flushMicrotasks();
    expect(initLlamaMock).toHaveBeenCalledTimes(1);
    expect(__getActiveNativeInitPromiseForTests()).not.toBeNull();

    await providerA.unload();
    // Retry requested while first native init is still unresolved.
    const providerB = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const pendingB = providerB.initialize();
    await flushMicrotasks();

    // Second native init must not have started yet.
    expect(initLlamaMock).toHaveBeenCalledTimes(1);

    const release = jest.fn(async () => undefined);
    first.resolve({ release, gpu: false });
    await expect(pendingA).rejects.toBeDefined();
    expect(release).toHaveBeenCalled();
    expect(providerA.isReady()).toBe(false);

    await flushMicrotasks();
    expect(initLlamaMock).toHaveBeenCalledTimes(2);

    second.resolve({ release: jest.fn(async () => undefined), gpu: false });
    await pendingB;
    expect(providerB.isReady()).toBe(true);
    expect(__getNativeInitStartsForTests()).toBe(2);
  });

  it('releases a late native context after unload/cancel and does not become ready', async () => {
    const load = deferred<{ release: jest.Mock; gpu: boolean }>();
    const release = jest.fn(async () => undefined);
    initLlamaMock.mockReturnValueOnce(load.promise as never);

    const provider = new LlamaRnProvider({ modelPath: '/data/model.gguf' });
    const pending = provider.initialize();
    await flushMicrotasks();

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
