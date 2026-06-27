import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from '@/theme/colors';
import { duration, fontSize, fontWeight, radius, spacing } from '@/theme/tokens';
import type { Theme } from '@/theme/types';
import { useSettingsStore } from '@/store/settingsStore';

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(mode: 'light' | 'dark'): Theme {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    mode,
    colors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    duration,
    shadow: {
      shadowColor: colors.shadow,
      shadowOpacity: mode === 'dark' ? 0.4 : 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const theme = useMemo(() => {
    const resolved =
      themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
    return buildTheme(resolved);
  }, [themeMode, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
