import type { ColorPaletteId, ColorScheme } from '@/theme/colors';
import type { duration, fontSize, fontWeight, radius, spacing } from '@/theme/tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type { ColorPaletteId };

export interface Theme {
  mode: 'light' | 'dark';
  palette: ColorPaletteId;
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  duration: typeof duration;
  /** Standard elevation/shadow preset for cards. */
  shadow: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
}
