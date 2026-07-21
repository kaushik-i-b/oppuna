import {
  getDeviceCapability,
  setCachedTotalMemoryBytesForTests,
  warmDeviceMemoryEstimate,
} from '@/services/deviceCapabilityService';

describe('deviceCapabilityService', () => {
  afterEach(() => {
    setCachedTotalMemoryBytesForTests(undefined);
  });

  it('disables local model on web', () => {
    const cap = getDeviceCapability({ platform: 'web' });
    expect(cap.canRunLocalModel).toBe(false);
    expect(cap.tier).toBe('low');
    expect(cap.recommendedGpuLayers).toBe(0);
  });

  it('uses CPU-oriented settings for low RAM devices', () => {
    const cap = getDeviceCapability({
      platform: 'android',
      totalMemoryBytes: 3.5 * 1024 * 1024 * 1024,
    });
    expect(cap.tier).toBe('low');
    expect(cap.recommendedGpuLayers).toBe(0);
    expect(cap.recommendedContextSize).toBeLessThanOrEqual(2048);
    expect(cap.canRunLocalModel).toBe(true);
  });

  it('allows larger context on high RAM devices without unsafe Android GPU offload', () => {
    const cap = getDeviceCapability({
      platform: 'android',
      totalMemoryBytes: 12 * 1024 * 1024 * 1024,
    });
    expect(cap.tier).toBe('high');
    expect(cap.recommendedContextSize).toBeGreaterThanOrEqual(3072);
    expect(cap.recommendedGpuLayers).toBe(0);
  });

  it('may enable GPU layers on iOS high tier', () => {
    const cap = getDeviceCapability({
      platform: 'ios',
      totalMemoryBytes: 12 * 1024 * 1024 * 1024,
    });
    expect(cap.recommendedGpuLayers).toBeGreaterThan(0);
  });

  it('uses warmed native memory when available', async () => {
    setCachedTotalMemoryBytesForTests(3 * 1024 * 1024 * 1024);
    const cap = getDeviceCapability({ platform: 'android' });
    expect(cap.tier).toBe('low');
    expect(cap.totalMemory).toBe(3 * 1024 * 1024 * 1024);
  });

  it('warmDeviceMemoryEstimate is safe when native module is missing', async () => {
    const result = await warmDeviceMemoryEstimate();
    expect(result === null || typeof result === 'number').toBe(true);
  });
});
