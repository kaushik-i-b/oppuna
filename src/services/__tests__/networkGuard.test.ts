import {
  __resetNetworkGuardForTests,
  beginVoiceNetworkWindow,
  endVoiceNetworkWindow,
  installNetworkGuard,
} from '@/services/networkGuard';

describe('networkGuard', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
    __resetNetworkGuardForTests();
    installNetworkGuard();
  });

  it('blocks public HTTPS requests', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(/offline-only/i);
  });

  it('allows the voice host only while a token request is in flight', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      calls.push(typeof input === 'string' ? input : input.toString());
      return { ok: true } as Response;
    }) as typeof fetch;
    __resetNetworkGuardForTests();
    installNetworkGuard();

    await expect(fetch('https://agents.assemblyai.com/v1/token')).rejects.toThrow(/offline-only/i);
    beginVoiceNetworkWindow(['agents.assemblyai.com']);
    await fetch('https://agents.assemblyai.com/v1/token');
    await expect(fetch('https://example.com/secret')).rejects.toThrow(/offline-only/i);
    endVoiceNetworkWindow();
    await expect(fetch('https://agents.assemblyai.com/v1/token')).rejects.toThrow(/offline-only/i);
    expect(calls).toEqual(['https://agents.assemblyai.com/v1/token']);
  });
});
