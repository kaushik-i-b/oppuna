/**
 * Central configuration for the on-device GGUF model.
 *
 * Release-critical metadata lives in config/local-model.json — the single
 * machine-readable source of truth shared with verify-model, verify-aab,
 * and the asset-pack plugin.
 *
 * Production model: Qwen2.5 1.5B Instruct (Q4_K_M), ~941 MB.
 * Play delivers it on demand so the initial install stays small.
 *
 * The GGUF binary itself must NOT be committed to git — see docs/LOCAL_LLM_ANDROID.md.
 */

import localModelJson from '../../config/local-model.json';

export const LOCAL_MODEL_CONFIG = {
  /** Stable identifier for verification metadata and diagnostics. */
  id: localModelJson.modelId,
  /** Human-readable label for diagnostics / settings. */
  displayName: localModelJson.displayName,
  /** Model family label (e.g. qwen2.5). */
  family: localModelJson.family,
  /** GGUF general.architecture (e.g. qwen2). */
  architecture: localModelJson.architecture,
  /** Exact upstream model identity. */
  exactModel: localModelJson.exactModel,
  /** Parameter-count label (e.g. 1.5B). */
  parameterCount: localModelJson.parameterCount,
  /** Quantization tag (e.g. Q4_K_M). */
  quantization: localModelJson.quantization,
  /** Upstream Hugging Face GGUF. Used only for the optional weight download. */
  sourceRepo: localModelJson.sourceRepo,
  sourceFile: localModelJson.sourceFile,
  sourceUrl: localModelJson.sourceUrl,
  /**
   * Exact file fetched when Play on-demand delivery is unavailable.
   * Must match sourceRepo + sourceFile. Integrity still requires sha256.
   */
  downloadUrl: localModelJson.downloadUrl,
  /** Filename inside the on-demand Play Asset Delivery pack. */
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
  /** On-demand delivery (must match Gradle assetPack.dynamicDelivery). */
  deliveryType: localModelJson.deliveryType as 'on-demand',
  /**
   * Extra free bytes beyond one private model copy for filesystem overhead
   * and normal app operation. Formula: expectedSize + storageHeadroomBytes.
   */
  storageHeadroomBytes: localModelJson.storageHeadroomBytes as number,
  /** SPDX-style license id for the bundled weights. */
  licenseId: localModelJson.licenseId,
  licenseName: localModelJson.licenseName,
  /** Chat template family used at inference (ChatML for Qwen2.5 Instruct). */
  chatTemplate: localModelJson.chatTemplate as 'chatml',
  /** Default context window; device capability service may lower this. */
  contextSize: localModelJson.contextSize as number,
  /** Hard cap on generated tokens per turn. */
  maxGenerationTokens: localModelJson.maxGenerationTokens as number,
  temperature: localModelJson.temperature as number,
  topP: localModelJson.topP as number,
  /** Generation wall-clock timeout (ms) so chat never hangs. */
  responseTimeoutMs: localModelJson.responseTimeoutMs as number,
  /** Model load wall-clock timeout (ms) — avoids indefinite startup hangs. */
  initTimeoutMs: localModelJson.initTimeoutMs as number,
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
 * Sourced from config/local-model.json — do not hardcode a second list.
 */
export const LOCAL_MODEL_STOP_SEQUENCES = [
  ...(localModelJson.stopSequences as string[]),
] as const;

/** Tokens that must never appear in Qwen stop / prompt formatting. */
export const PROHIBITED_LEGACY_MODEL_TOKENS = [
  '<start_of_turn>',
  '<end_of_turn>',
  '<esc>',
] as const;
