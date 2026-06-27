import { useMemo } from 'react';

import { createTranslator, type LanguageCode, type TranslationKey } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export interface UseTranslation {
  t: (key: TranslationKey) => string;
  language: LanguageCode;
}

export function useTranslation(): UseTranslation {
  const language = useSettingsStore((s) => s.language);
  return useMemo(() => ({ t: createTranslator(language), language }), [language]);
}
