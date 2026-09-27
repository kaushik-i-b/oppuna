import {
  __resetNetworkGuardForTests,
  __resetVoiceNetworkingForTests,
  installNetworkGuard,
  isVoiceNetworkingEnabled,
  setVoiceNetworkingEnabled,
} from '@/services/networkGuard';

describe('voice networking exception', () => {
  const originalFetch = global.fetch;
  let fetchImpl: jest.Mock;

  beforeEach(() => {
    fetchImpl = jest.fn(async () => new Response('{}'));
    global.fetch = fetchImpl as unknown as typeof fetch;
    __resetNetworkGuardForTests();
    __resetVoiceNetworkingForTests();
    installNetworkGuard();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    __resetVoiceNetworkingForTests();
  });

  it('blocks AssemblyAI hosts by default (offline-first)', async () => {
    await expect(fetch('https://api.assemblyai.com/v2/realtime/token')).rejects.toThrow(
      /offline-only/i,
    );
    expect(isVoiceNetworkingEnabled()).toBe(false);
  });

  it('allows AssemblyAI hosts while the voice session opts in, then blocks again', async () => {
    setVoiceNetworkingEnabled(true);
    await expect(
      fetch('https://streaming.assemblyai.com/v3/ws?sample_rate=16000'),
    ).resolves.toBeDefined();
    setVoiceNetworkingEnabled(false);
    await expect(fetch('https://api.assemblyai.com/v2/transcript')).rejects.toThrow(
      /offline-only/i,
    );
  });

  it('never opens the exception to unrelated hosts', async () => {
    setVoiceNetworkingEnabled(true);
    await expect(fetch('https://example-analytics.com/track')).rejects.toThrow(/offline-only/i);
  });
});
