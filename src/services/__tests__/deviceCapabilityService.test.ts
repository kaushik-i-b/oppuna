import { getDeviceCapability } from '@/services/deviceCapabilityService';

describe('deviceCapabilityService', () => {
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
});
