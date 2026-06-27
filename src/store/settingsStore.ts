import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LanguageCode } from '@/i18n';
import type { ThemeMode } from '@/theme/types';

interface SettingsState {
  themeMode: ThemeMode;
  language: LanguageCode;
  onboardingComplete: boolean;
  disclaimerAccepted: boolean;
  appLockEnabled: boolean;
  hydrated: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
  completeOnboarding: () => void;
  acceptDisclaimer: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  resetPreferences: () => void;
  setHydrated: (value: boolean) => void;
}

const DEFAULTS = {
  themeMode: 'system' as ThemeMode,
  language: 'en' as LanguageCode,
  onboardingComplete: false,
  disclaimerAccepted: false,
  appLockEnabled: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,

      setThemeMode: (themeMode) => set({ themeMode }),
      setLanguage: (language) => set({ language }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
      setAppLockEnabled: (appLockEnabled) => set({ appLockEnabled }),
      resetPreferences: () => set({ ...DEFAULTS }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'oppuna.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
        onboardingComplete: state.onboardingComplete,
        disclaimerAccepted: state.disclaimerAccepted,
        appLockEnabled: state.appLockEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
