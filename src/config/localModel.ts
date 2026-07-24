/**
 * Central configuration for the on-device GGUF model.
 *
 * Release-critical metadata (size, SHA-256, pack name) lives in
 * config/local-model.json — the single machine-readable source of truth
 * shared with verify-model, verify-aab, and the asset-pack plugin.
 *
 * Production model: Qwen2.5 1.5B Instruct (Q4_K_M), ~941 MB — fits under
 * Google Play's 1 GB install-time asset pack limit.
 *
 * The GGUF binary itself must NOT be committed to git — see docs/LOCAL_LLM_ANDROID.md.
 */

import localModelJson from '../../config/local-model.json';

export const LOCAL_MODEL_CONFIG = {
  /** Stable identifier for verification metadata and diagnostics. */
  id: localModelJson.modelId,
  /** Human-readable label for diagnostics / settings. */
  displayName: localModelJson.displayName,
  /** Upstream Hugging Face GGUF source (developer reference only — not fetched at runtime). */
  sourceRepo: localModelJson.sourceRepo,
  sourceFile: localModelJson.sourceFile,
  /** Filename inside the install-time Play Asset Delivery pack. */
  fileName: localModelJson.fileName,
  /** Bump when the shipped GGUF changes so integrity re-runs. */
  version: String(localModelJson.version),
  /**
   * Expected SHA-256 hex digest of the GGUF file.
   * Computed from assets/ai-model/model.gguf (Qwen2.5 1.5B Instruct Q4_K_M).
   */
  sha256: localModelJson.sha256 as string,
  /**
   * Expected byte size. When > 0, size checks reject obviously corrupt files.
   */
  expectedSize: localModelJson.expectedSize as number,
  /** Absolute minimum plausible GGUF size (guards empty / truncated files). */
  minPlausibleSizeBytes: localModelJson.minPlausibleSizeBytes as number,
  /** Play Asset Delivery pack name (must match the Gradle asset pack). */
  assetPackName: localModelJson.assetPackName,
  /** Install-time delivery (must match Gradle assetPack.dynamicDelivery). */
  deliveryType: localModelJson.deliveryType as 'install-time',
  /**
   * Extra free bytes beyond one private model copy for filesystem overhead
   * and normal app operation. Formula: expectedSize + storageHeadroomBytes.
   */
  storageHeadroomBytes: localModelJson.storageHeadroomBytes as number,
  /** Default context window; device capability service may lower this. */
  contextSize: 4096,
  /** Hard cap on generated tokens per turn. */
  maxGenerationTokens: 220,
  temperature: 0.65,
  topP: 0.9,
  /** Generation wall-clock timeout (ms) so chat never hangs. */
  responseTimeoutMs: 60_000,
  /** Model load wall-clock timeout (ms) — avoids indefinite startup hangs. */
  initTimeoutMs: 120_000,
} as const;

export type LocalModelConfig = typeof LOCAL_MODEL_CONFIG;

/**
 * Free space required to prepare a private copy of the bundled model.
 * One temp/private copy (+ headroom). Temp is atomically renamed to final,
 * so we do not need 2× model size free.
 */
export function requiredPrivateModelStorageBytes(
  expectedSize: number = LOCAL_MODEL_CONFIG.expectedSize,
  headroomBytes: number = LOCAL_MODEL_CONFIG.storageHeadroomBytes,
): number {
  return expectedSize + headroomBytes;
}

/**
 * Stop sequences for Qwen ChatML (and common chat templates).
 * Qwen2.5 Instruct uses `<|im_end|>` / `<|endoftext|>`.
 */
export const LOCAL_MODEL_STOP_SEQUENCES = [
  '<|im_end|>',
  '<|im_start|>',
  '<|endoftext|>',
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|EOT|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
] as const;
