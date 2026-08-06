export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type LanguageCode =
  | 'en'
  | 'en-IN'
  | 'es'
  | 'pt'
  | 'kn'
  | 'ta'
  | 'ml'
  | 'te'
  | 'hi'
  | 'ar'
  | 'ru';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  /** Endonym (name in its own language). */
  native: string;
  /**
   * When false, Chat shows a “coming soon” notice for AI in this language.
   * UI chrome may still be localized.
   */
  aiChatAvailable?: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', native: 'English', aiChatAvailable: true },
  {
    code: 'en-IN',
    label: 'English (India)',
    native: 'English (India)',
    aiChatAvailable: true,
  },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', aiChatAvailable: true },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', aiChatAvailable: false },
  { code: 'es', label: 'Spanish', native: 'Español', aiChatAvailable: true },
  { code: 'pt', label: 'Portuguese', native: 'Português', aiChatAvailable: true },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', aiChatAvailable: true },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', aiChatAvailable: true },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', aiChatAvailable: true },
  { code: 'ar', label: 'Arabic', native: 'العربية', aiChatAvailable: true },
  { code: 'ru', label: 'Russian', native: 'Русский', aiChatAvailable: true },
];

const LANGUAGE_CODES: ReadonlySet<string> = new Set(LANGUAGES.map((l) => l.code));

/** True when the persisted code is still a supported UI language. */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_CODES.has(value);
}

/** Languages where on-device AI chat is not localized yet. */
export function isAiChatComingSoon(language: LanguageCode): boolean {
  const meta = LANGUAGES.find((l) => l.code === language);
  return meta?.aiChatAvailable === false;
}
