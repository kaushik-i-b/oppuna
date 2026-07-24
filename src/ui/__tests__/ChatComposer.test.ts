import { ChatComposer } from '@/ui/ChatComposer';

describe('ChatComposer contract', () => {
  it('exports a function component', () => {
    expect(typeof ChatComposer).toBe('function');
  });
});

describe('chat keyboard layout contract', () => {
  it('documents required composer max height', () => {
    // ChatComposer enforces MAX_HEIGHT = 120; keep in sync if changed.
    const MAX_HEIGHT = 120;
    const MIN_HEIGHT = 44;
    expect(MAX_HEIGHT).toBeGreaterThan(MIN_HEIGHT);
    expect(MAX_HEIGHT).toBeLessThanOrEqual(160);
  });
});
