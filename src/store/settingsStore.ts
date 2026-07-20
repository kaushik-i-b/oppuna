import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_AGENT_ID, type AgentId } from '@/ai/agents';
import { DEFAULT_CRISIS_REGION, type CrisisRegionCode } from '@/constants/crisis';
import type { LanguageCode } from '@/i18n';
import type { ThemeMode } from '@/theme/types';

interface SettingsState {
  themeMode: ThemeMode;
  language: LanguageCode;
  onboardingComplete: boolean;
  disclaimerAccepted: boolean;
  appLockEnabled: boolean;
  crisisRegion: CrisisRegionCode;
  chatAgentId: AgentId;
  hydrated: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
  completeOnboarding: () => void;
  acceptDisclaimer: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setCrisisRegion: (region: CrisisRegionCode) => void;
  setChatAgentId: (agentId: AgentId) => void;
  resetPreferences: () => void;
  setHydrated: (value: boolean) => void;
}

const DEFAULTS = {
  themeMode: 'system' as ThemeMode,
  language: 'en' as LanguageCode,
  onboardingComplete: false,
  disclaimerAccepted: false,
  appLockEnabled: false,
  crisisRegion: DEFAULT_CRISIS_REGION,
  chatAgentId: DEFAULT_AGENT_ID,
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
      setCrisisRegion: (crisisRegion) => set({ crisisRegion }),
      setChatAgentId: (chatAgentId) => set({ chatAgentId }),
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
        crisisRegion: state.crisisRegion,
        chatAgentId: state.chatAgentId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
