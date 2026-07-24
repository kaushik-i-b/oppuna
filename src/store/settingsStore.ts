import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CRISIS_REGION, type CrisisRegionCode } from '@/constants/crisis';
import type { LanguageCode } from '@/i18n';
import { cancelCareReminders } from '@/services/careReminderService';
import { DEFAULT_COLOR_PALETTE, type ColorPaletteId } from '@/theme/colors';
import type { ThemeMode } from '@/theme/types';

interface SettingsState {
  themeMode: ThemeMode;
  /** Brand ColorScheme palette (independent of light/dark). */
  colorPalette: ColorPaletteId;
  language: LanguageCode;
  onboardingComplete: boolean;
  disclaimerAccepted: boolean;
  appLockEnabled: boolean;
  /** Opt-in local daily care reminders (on-device only, no push server). */
  careRemindersEnabled: boolean;
  crisisRegion: CrisisRegionCode;
  hydrated: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setColorPalette: (palette: ColorPaletteId) => void;
  setLanguage: (language: LanguageCode) => void;
  completeOnboarding: () => void;
  acceptDisclaimer: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setCareRemindersEnabled: (enabled: boolean) => void;
  setCrisisRegion: (region: CrisisRegionCode) => void;
  resetPreferences: () => void;
  setHydrated: (value: boolean) => void;
}

const DEFAULTS = {
  themeMode: 'system' as ThemeMode,
  colorPalette: DEFAULT_COLOR_PALETTE,
  language: 'en' as LanguageCode,
  onboardingComplete: false,
  disclaimerAccepted: false,
  appLockEnabled: false,
  careRemindersEnabled: false,
  crisisRegion: DEFAULT_CRISIS_REGION,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,

      setThemeMode: (themeMode) => set({ themeMode }),
      setColorPalette: (colorPalette) => set({ colorPalette }),
      setLanguage: (language) => set({ language }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
      setAppLockEnabled: (appLockEnabled) => set({ appLockEnabled }),
      setCareRemindersEnabled: (careRemindersEnabled) => set({ careRemindersEnabled }),
      setCrisisRegion: (crisisRegion) => set({ crisisRegion }),
      resetPreferences: () => {
        void cancelCareReminders().catch(() => undefined);
        set({ ...DEFAULTS });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'oppuna.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        colorPalette: state.colorPalette,
        language: state.language,
        onboardingComplete: state.onboardingComplete,
        disclaimerAccepted: state.disclaimerAccepted,
        appLockEnabled: state.appLockEnabled,
        careRemindersEnabled: state.careRemindersEnabled,
        crisisRegion: state.crisisRegion,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
