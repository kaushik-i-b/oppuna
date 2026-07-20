/**
 * Central configuration for the on-device GGUF model.
 *
 * Do not scatter model constants elsewhere. Update SHA-256 / size here when
 * swapping the production model used in the Play Asset Delivery pack.
 *
 * The GGUF binary itself must NOT be committed to git — see docs/LOCAL_LLM_ANDROID.md.
 */

export const LOCAL_MODEL_CONFIG = {
  /** Stable identifier for verification metadata and diagnostics. */
  id: 'oppuna-local-v1',
  /** Filename inside the install-time Play Asset Delivery pack. */
  fileName: 'model.gguf',
  /** Bump when the shipped GGUF changes so integrity re-runs. */
  version: '1',
  /**
   * Expected SHA-256 hex digest of the GGUF file.
   * Leave empty during development; set before production AAB release.
   */
  sha256: '' as string,
  /**
   * Expected byte size. When > 0, size checks reject obviously corrupt files.
   * Leave 0 until a real model is placed in the asset pack.
   */
  expectedSize: 0 as number,
  /** Absolute minimum plausible GGUF size (guards empty / truncated files). */
  minPlausibleSizeBytes: 1_000_000,
  /** Play Asset Delivery pack name (must match the Gradle asset pack). */
  assetPackName: 'ai_model_asset_pack',
  /** Default context window; device capability service may lower this. */
  contextSize: 4096,
  /** Hard cap on generated tokens per turn. */
  maxGenerationTokens: 220,
  temperature: 0.65,
  topP: 0.9,
  /** Generation wall-clock timeout (ms) so chat never hangs. */
  responseTimeoutMs: 60_000,
} as const;

export type LocalModelConfig = typeof LOCAL_MODEL_CONFIG;

/** Stop sequences shared across chat templates used by small local models. */
export const LOCAL_MODEL_STOP_SEQUENCES = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|im_end|>',
  '<|EOT|>',
  '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>',
  '<|endoftext|>',
] as const;
