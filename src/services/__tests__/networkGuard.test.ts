import { __resetNetworkGuardForTests, installNetworkGuard } from '@/services/networkGuard';

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
});
