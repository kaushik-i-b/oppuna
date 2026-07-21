/**
 * Central configuration for the on-device GGUF model.
 *
 * Production model: Google Gemma 3 1B Instruct (Q4_K_M), ~769 MB — fits under
 * Google Play's 1 GB install-time asset pack limit.
 *
 * Do not scatter model constants elsewhere. Update SHA-256 / size here when
 * swapping the production model used in the Play Asset Delivery pack.
 *
 * The GGUF binary itself must NOT be committed to git — see docs/LOCAL_LLM_ANDROID.md.
 */

export const LOCAL_MODEL_CONFIG = {
  /** Stable identifier for verification metadata and diagnostics. */
  id: 'oppuna-gemma3-1b-it-q4km',
  /** Human-readable label for diagnostics / settings. */
  displayName: 'Gemma 3 1B Instruct (Q4_K_M)',
  /** Upstream Hugging Face GGUF source (developer reference only — not fetched at runtime). */
  sourceRepo: 'bartowski/google_gemma-3-1b-it-GGUF',
  sourceFile: 'google_gemma-3-1b-it-Q4_K_M.gguf',
  /** Filename inside the install-time Play Asset Delivery pack. */
  fileName: 'model.gguf',
  /** Bump when the shipped GGUF changes so integrity re-runs. */
  version: '2',
  /**
   * Expected SHA-256 hex digest of the GGUF file.
   * Computed from assets/ai-model/model.gguf (Gemma 3 1B Instruct Q4_K_M).
   */
  sha256: '12bf0fff8815d5f73a3c9b586bd8fee8e7b248c935de70dec367679873d0f29d' as string,
  /**
   * Expected byte size. When > 0, size checks reject obviously corrupt files.
   */
  expectedSize: 806_058_496 as number,
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

/**
 * Stop sequences for Gemma (and common chat templates).
 * Gemma 3 instruct uses `<end_of_turn>` / `<eos>`.
 */
export const LOCAL_MODEL_STOP_SEQUENCES = [
  '<end_of_turn>',
  '<eos>',
  '<start_of_turn>',
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
