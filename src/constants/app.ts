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
 * On-device LLM configuration. Place a GGUF file at
 * `{documentDirectory}models/{storageFilename}` to enable the local model.
 * Production builds may also bundle the model under `assets/models/`.
 */
export const LLM_CONFIG = {
  storageDir: 'models',
  storageFilename: 'oppuna-model.gguf',
  contextSize: 2048,
  maxThreads: 4,
  /** GPU layers on iOS (Metal). Set to 0 for CPU-only on Android if needed. */
  gpuLayers: 99,
} as const;

/**
 * The on-device mental-wellness model. Oppuna runs a small Llama model fully
 * on the device via llama.rn; nothing you type is ever sent anywhere.
 *
 * The model weights are downloaded once, on explicit user request, over a
 * single allow-listed connection (see `services/networkGuard`). After the
 * one-time download the app works entirely offline, in airplane mode.
 *
 * We ship a 4-bit quantised Llama 3.2 1B Instruct build — small and fast
 * enough to run comfortably on a phone while still giving warm, natural
 * replies.
 */
export const LLAMA_MODEL = {
  id: 'llama-3.2-1b-instruct-q4_k_m',
  displayName: 'Llama 3.2 1B Instruct',
  quantization: 'Q4_K_M',
  /** Direct GGUF download (Hugging Face LFS resolve endpoint). */
  downloadUrl:
    'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf?download=true',
  /** Approximate download size, used for progress + storage messaging. */
  approxBytes: 807_694_016,
  approxSizeLabel: '≈ 0.8 GB',
  license: 'Llama 3.2 Community License',
} as const;

/**
 * Hosts the app is permitted to reach — used *only* for the one-time,
 * user-initiated on-device model download. Every other outbound request is
 * blocked by the network guard. No user data is ever uploaded to these hosts.
 */
export const MODEL_DOWNLOAD_HOSTS = [
  'huggingface.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs-us-1.huggingface.co',
  'cdn-lfs-eu-1.huggingface.co',
  'hf.co',
] as const;
