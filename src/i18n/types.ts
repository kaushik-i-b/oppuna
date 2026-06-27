export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type LanguageCode = 'en' | 'es' | 'hi';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  /** Endonym (name in its own language). */
  native: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];
