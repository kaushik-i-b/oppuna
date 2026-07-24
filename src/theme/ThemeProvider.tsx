import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  DEFAULT_COLOR_PALETTE,
  isColorPaletteId,
  resolveColorScheme,
  type ColorPaletteId,
} from '@/theme/colors';
import { duration, fontSize, fontWeight, radius, spacing } from '@/theme/tokens';
import type { Theme } from '@/theme/types';
import { useSettingsStore } from '@/store/settingsStore';

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(mode: 'light' | 'dark', palette: ColorPaletteId): Theme {
  const colors = resolveColorScheme(palette, mode);
  return {
    mode,
    palette,
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
  const colorPalette = useSettingsStore((s) => s.colorPalette);

  const theme = useMemo(() => {
    const resolved =
      themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
    const palette = isColorPaletteId(colorPalette) ? colorPalette : DEFAULT_COLOR_PALETTE;
    return buildTheme(resolved, palette);
  }, [themeMode, colorPalette, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
