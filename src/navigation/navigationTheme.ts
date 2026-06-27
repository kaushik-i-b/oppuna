import { DarkTheme, DefaultTheme, type Theme as NavTheme } from '@react-navigation/native';

import type { Theme } from '@/theme/types';

export function toNavigationTheme(theme: Theme): NavTheme {
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.mode === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}
