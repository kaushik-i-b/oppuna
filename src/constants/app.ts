export const APP = {
  name: 'Oppuna',
  tagline: 'A private, offline journal, mood, and reflection companion.',
  version: '1.0.0',
} as const;

export const MEDICAL_DISCLAIMER =
  'Oppuna is a wellness and journaling companion. It is not a substitute for ' +
  'professional medical, psychological, or emergency services. It does not ' +
  'diagnose, treat, cure, or prevent any condition. If you are in danger or ' +
  'need medical help, contact your local emergency services right away.';

export const TERMS_OF_USE =
  'By using Oppuna you agree to these terms. Oppuna is provided “as is,” for ' +
  'personal wellbeing and self-reflection only. It is not a medical device and ' +
  'does not provide medical, psychological, legal, or emergency advice. You are ' +
  'responsible for how you use the app and for seeking qualified professional ' +
  'help when you need it. Because Oppuna stores everything only on your device ' +
  'and never sends data anywhere, you are solely responsible for backing up or ' +
  'exporting your data; uninstalling the app or clearing its storage will ' +
  'permanently erase it. The app is offered without warranties of any kind, and ' +
  'to the fullest extent permitted by law the developer is not liable for any ' +
  'loss arising from its use.';

export const PRIVACY_STATEMENT =
  'Everything you write, record, and track in Oppuna stays on this device. ' +
  'There is no account, no cloud sync, no analytics, and no tracking. ' +
  'Oppuna works fully in airplane mode and never sends your data anywhere. ' +
  'You can export a copy of your data or delete all of it at any time from Settings.';

/** Secure-store keys (never store sensitive content here, only flags/preferences). */
export const SECURE_KEYS = {
  appLockEnabled: 'oppuna.appLock.enabled',
} as const;

/**
 * On-device LLM configuration for the Llama-powered mental-health agent.
 *
 * The agent runs fully on the device via `llama.rn`. For that, GGUF weights
 * must exist at `{documentDirectory}models/{storageFilename}`. There are two
 * fully-offline ways to get them there:
 *
 *   1. Bundle a Llama GGUF with the app (recommended for shipping). Drop the
 *      file at `assets/models/oppuna-model.gguf` and point `bundledModelAsset`
 *      at it with `require('../../assets/models/oppuna-model.gguf')`. On first
 *      launch the model provisioner copies it into local storage — no network.
 *   2. Side-load a `.gguf` into `{documentDirectory}models/` during dev.
 *
 * When no model is available the app still runs and gracefully uses the
 * deterministic rule-based engine.
 *
 * A small, quantized instruction-tuned Llama build (e.g. Llama 3.2 1B Instruct
 * at Q4_K_M) is a good fit for on-device chat.
 */
export const LLM_CONFIG = {
  storageDir: 'models',
  storageFilename: 'oppuna-model.gguf',
  /**
   * Optional Llama GGUF bundled with the app. Set to
   * `require('../../assets/models/oppuna-model.gguf')` once a model file is
   * added under `assets/models/`. Left `null` here so the repo ships without a
   * multi-hundred-MB binary; the provisioner no-ops until a model is supplied.
   */
  bundledModelAsset: null as number | null,
  /** Human-readable label for the bundled/expected model, shown in logs. */
  modelLabel: 'Llama (on-device)',
  contextSize: 2048,
  maxThreads: 4,
  /** GPU layers on iOS (Metal). Set to 0 for CPU-only on Android if needed. */
  gpuLayers: 99,
} as const;
