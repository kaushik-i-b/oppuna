import { en, type Translation } from '@/i18n/locales/en';
import { enIN } from '@/i18n/locales/en-IN';
import { es } from '@/i18n/locales/es';
import { pt } from '@/i18n/locales/pt';
import { kn } from '@/i18n/locales/kn';
import { ta } from '@/i18n/locales/ta';
import { ml } from '@/i18n/locales/ml';
import { te } from '@/i18n/locales/te';
import { hi } from '@/i18n/locales/hi';
import { ar } from '@/i18n/locales/ar';
import { ru } from '@/i18n/locales/ru';
import type { DeepPartial, LanguageCode } from '@/i18n/types';

export { LANGUAGES, isLanguageCode, isAiChatComingSoon } from '@/i18n/types';
export type { LanguageCode, LanguageMeta } from '@/i18n/types';
export type { Translation } from '@/i18n/locales/en';

const DICTIONARIES: Record<LanguageCode, DeepPartial<Translation>> = {
  en,
  'en-IN': enIN,
  es,
  pt,
  kn,
  ta,
  ml,
  te,
  hi,
  ar,
  ru,
};

/** Dot-notation paths into the translation tree, e.g. "settings.title". */
export type TranslationKey = NestedKeys<Translation>;

type NestedKeys<T> = {
  [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeys<T[K]>}` : K;
}[keyof T & string];

function read(dict: unknown, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Resolves a translation key for a language, falling back to English, then to
 * the key itself so the UI never shows blank text.
 */
export function translate(language: LanguageCode, key: TranslationKey): string {
  return read(DICTIONARIES[language], key) ?? read(en, key) ?? key;
}

export function createTranslator(language: LanguageCode) {
  return (key: TranslationKey): string => translate(language, key);
}
