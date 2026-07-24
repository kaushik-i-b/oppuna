/**
 * Device capability heuristics for on-device LLM configuration.
 *
 * Conservative by design: underestimate free RAM and prefer stability over
 * maximum context / GPU offload. Never crashes the app.
 */

import { NativeModules, Platform } from 'react-native';

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { logger } from '@/utils/logger';

export type DeviceTier = 'low' | 'medium' | 'high';

export interface DeviceCapability {
  tier: DeviceTier;
  /** Best-effort total RAM estimate in bytes, or null when unknown. */
  totalMemory: number | null;
  recommendedContextSize: number;
  /** GPU layers to offload. Prefer 0 on untested Android devices. */
  recommendedGpuLayers: number;
  maxGenerationTokens: number;
  /** llama.cpp threads hint. */
  recommendedThreads: number;
  /** Whether this device is considered too constrained for the local model. */
  canRunLocalModel: boolean;
  reason: string;
}

interface CapabilityOverrides {
  totalMemoryBytes?: number | null;
  platform?: typeof Platform.OS;
}

interface OppunaModelAssetMemoryModule {
  getTotalMemoryBytes?: () => Promise<number>;
}

/** Devices below this threshold cannot reliably load Gemma 3 1B Q4_K_M. */
const UNSUPPORTED_RAM_BYTES = 3 * 1024 * 1024 * 1024;
/** Rough RAM tiers commonly seen on Android phones Oppuna targets. */
const LOW_RAM_BYTES = 4 * 1024 * 1024 * 1024;
const MEDIUM_RAM_BYTES = 6 * 1024 * 1024 * 1024;
const HIGH_RAM_BYTES = 8 * 1024 * 1024 * 1024;

/**
 * Cached native RAM reading. `undefined` = not yet probed;
 * `null` = probe failed / unavailable.
 */
let cachedTotalMemoryBytes: number | null | undefined;

/**
 * Probe Android ActivityManager for total device RAM (best-effort).
 * Call once at app bootstrap so sync `getDeviceCapability()` can use it.
 */
export async function warmDeviceMemoryEstimate(): Promise<number | null> {
  if (Platform.OS !== 'android') {
    cachedTotalMemoryBytes = cachedTotalMemoryBytes ?? null;
    return cachedTotalMemoryBytes;
  }

  try {
    const mod = NativeModules.OppunaModelAsset as OppunaModelAssetMemoryModule | undefined;
    if (!mod?.getTotalMemoryBytes) {
      cachedTotalMemoryBytes = null;
      return null;
    }
    const bytes = await mod.getTotalMemoryBytes();
    if (typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0) {
      cachedTotalMemoryBytes = bytes;
      return bytes;
    }
    cachedTotalMemoryBytes = null;
    return null;
  } catch (error) {
    logger.warn('Unable to read device total memory', { error: String(error) });
    cachedTotalMemoryBytes = null;
    return null;
  }
}

/** Test-only: clear / set the cached RAM probe. */
export function setCachedTotalMemoryBytesForTests(value: number | null | undefined): void {
  cachedTotalMemoryBytes = value;
}

/**
 * Estimate total device memory.
 * Prefer a warmed native reading; otherwise use a conservative medium-tier
 * assumption on native and null on web.
 */
function estimateTotalMemoryBytes(platform: typeof Platform.OS): number | null {
  if (platform === 'web') return null;
  if (cachedTotalMemoryBytes !== undefined) {
    return cachedTotalMemoryBytes ?? MEDIUM_RAM_BYTES;
  }
  // Conservative default before/without a native probe: ~6 GB class.
  return MEDIUM_RAM_BYTES;
}

function tierFromMemory(totalMemory: number | null): DeviceTier {
  if (totalMemory === null) return 'medium';
  if (totalMemory < LOW_RAM_BYTES) return 'low';
  if (totalMemory < HIGH_RAM_BYTES) return 'medium';
  return 'high';
}

/**
 * Resolve inference knobs for the current device.
 * Safe to call on any platform; never throws.
 */
export function getDeviceCapability(overrides: CapabilityOverrides = {}): DeviceCapability {
  const platform = overrides.platform ?? Platform.OS;
  const totalMemory =
    overrides.totalMemoryBytes !== undefined
      ? overrides.totalMemoryBytes
      : estimateTotalMemoryBytes(platform);

  if (platform === 'web') {
    return {
      tier: 'low',
      totalMemory: null,
      recommendedContextSize: 512,
      recommendedGpuLayers: 0,
      maxGenerationTokens: 64,
      recommendedThreads: 1,
      canRunLocalModel: false,
      reason: 'Local GGUF inference is not supported on web.',
    };
  }

  const tier = tierFromMemory(totalMemory);

  if (totalMemory !== null && totalMemory < UNSUPPORTED_RAM_BYTES) {
    return {
      tier: 'low',
      totalMemory,
      recommendedContextSize: 512,
      recommendedGpuLayers: 0,
      maxGenerationTokens: 64,
      recommendedThreads: 1,
      canRunLocalModel: false,
      reason: 'This device does not have enough memory for the on-device AI model.',
    };
  }

  if (tier === 'low') {
    return {
      tier,
      totalMemory,
      recommendedContextSize: Math.min(2048, LOCAL_MODEL_CONFIG.contextSize),
      recommendedGpuLayers: 0,
      maxGenerationTokens: Math.min(160, LOCAL_MODEL_CONFIG.maxGenerationTokens),
      recommendedThreads: 2,
      canRunLocalModel: true,
      reason: 'Limited RAM — CPU-only, smaller context.',
    };
  }

  if (tier === 'medium') {
    return {
      tier,
      totalMemory,
      recommendedContextSize: Math.min(3072, LOCAL_MODEL_CONFIG.contextSize),
      // Partial offload only on iOS Metal by default; Android OpenCL varies widely.
      recommendedGpuLayers: platform === 'ios' ? 16 : 0,
      maxGenerationTokens: LOCAL_MODEL_CONFIG.maxGenerationTokens,
      recommendedThreads: 4,
      canRunLocalModel: true,
      reason: 'Moderate RAM — balanced context, conservative acceleration.',
    };
  }

  return {
    tier,
    totalMemory,
    recommendedContextSize: LOCAL_MODEL_CONFIG.contextSize,
    recommendedGpuLayers: platform === 'ios' ? 99 : 0,
    maxGenerationTokens: LOCAL_MODEL_CONFIG.maxGenerationTokens,
    recommendedThreads: 4,
    canRunLocalModel: true,
    reason: 'Higher RAM — larger context; GPU offload only where stable.',
  };
}
