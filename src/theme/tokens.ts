/**
 * Design tokens shared across light and dark themes.
 * These values define the visual rhythm of the entire app.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.6,
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
