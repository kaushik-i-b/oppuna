import {
  FakeLocalLLMProvider,
  LocalLLMProviderError,
} from '@/ai/providers';

describe('FakeLocalLLMProvider', () => {
  it('starts uninitialized and is not ready', () => {
    const provider = new FakeLocalLLMProvider();
    expect(provider.getStatus()).toBe('uninitialized');
    expect(provider.isReady()).toBe(false);
  });

  it('becomes ready after initialize()', async () => {
    const provider = new FakeLocalLLMProvider();
    await provider.initialize();
    expect(provider.isReady()).toBe(true);
    expect(provider.getStatus()).toBe('ready');
  });

  it('fails initialization when configured to', async () => {
    const provider = new FakeLocalLLMProvider({ initializeOk: false });
    await expect(provider.initialize()).rejects.toBeInstanceOf(LocalLLMProviderError);
    expect(provider.getStatus()).toBe('failed');
    expect(provider.isReady()).toBe(false);
  });

  it('streams tokens through onToken', async () => {
    const provider = new FakeLocalLLMProvider({
      reply: 'one two three',
    });
    await provider.initialize();
    const tokens: string[] = [];
    const text = await provider.chat(
      [{ role: 'user', content: 'hi' }],
      {},
      (token) => tokens.push(token),
    );
    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens.join('')).toBe(text);
  });

  it('prevents duplicate simultaneous generations', async () => {
    const provider = new FakeLocalLLMProvider({ latencyMs: 50, reply: 'slow' });
    await provider.initialize();
    const first = provider.chat([{ role: 'user', content: 'a' }]);
    await expect(provider.chat([{ role: 'user', content: 'b' }])).rejects.toMatchObject({
      code: 'busy',
    });
    await first;
  });

  it('supports cancellation', async () => {
    const provider = new FakeLocalLLMProvider({ latencyMs: 80, reply: 'cancelled?' });
    await provider.initialize();
    const pending = provider.chat([{ role: 'user', content: 'hi' }]);
    await provider.cancelGeneration();
    await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('unloads and reports not ready', async () => {
    const provider = new FakeLocalLLMProvider();
    await provider.initialize();
    await provider.unload();
    expect(provider.getStatus()).toBe('unloaded');
    expect(provider.isReady()).toBe(false);
  });
});
