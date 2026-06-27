/** Semantic color palettes for light and dark modes. */

export interface ColorScheme {
  /** App background */
  background: string;
  /** Slightly raised background (sections) */
  backgroundAlt: string;
  /** Card / surface */
  surface: string;
  /** Surface pressed / subtle highlight */
  surfaceAlt: string;
  /** Primary brand */
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  /** Secondary accent (calm lavender) */
  accent: string;
  accentMuted: string;
  /** Text */
  text: string;
  textMuted: string;
  textFaint: string;
  /** Borders / dividers */
  border: string;
  /** States */
  success: string;
  warning: string;
  danger: string;
  dangerMuted: string;
  onDanger: string;
  /** Mood colors */
  moodGreat: string;
  moodGood: string;
  moodOkay: string;
  moodLow: string;
  moodAwful: string;
  /** Overlay */
  overlay: string;
  /** Shadow color (used with elevation) */
  shadow: string;
}

export const lightColors: ColorScheme = {
  background: '#F4F7F5',
  backgroundAlt: '#EAF0EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F1',
  primary: '#0E7C66',
  primaryMuted: '#D6ECE5',
  onPrimary: '#FFFFFF',
  accent: '#6C63B5',
  accentMuted: '#E5E3F4',
  text: '#16201C',
  textMuted: '#4C5A54',
  textFaint: '#8A968F',
  border: '#DDE5E0',
  success: '#2E8B57',
  warning: '#C98A1A',
  danger: '#C0392B',
  dangerMuted: '#FBE6E3',
  onDanger: '#FFFFFF',
  moodGreat: '#2E8B57',
  moodGood: '#6FB98F',
  moodOkay: '#E0B450',
  moodLow: '#E08A50',
  moodAwful: '#C0392B',
  overlay: 'rgba(16, 32, 28, 0.45)',
  shadow: '#0E2A22',
};

export const darkColors: ColorScheme = {
  background: '#0F1714',
  backgroundAlt: '#15201C',
  surface: '#1A2722',
  surfaceAlt: '#22302A',
  primary: '#4FD1B0',
  primaryMuted: '#1E3A33',
  onPrimary: '#06231C',
  accent: '#A79EE6',
  accentMuted: '#2A2740',
  text: '#ECF3EF',
  textMuted: '#A7B5AE',
  textFaint: '#6F7E77',
  border: '#2A3833',
  success: '#5FCB8C',
  warning: '#E0B450',
  danger: '#F06A5A',
  dangerMuted: '#3A211E',
  onDanger: '#1A0E0C',
  moodGreat: '#5FCB8C',
  moodGood: '#7FC9A3',
  moodOkay: '#E0B450',
  moodLow: '#E89B6B',
  moodAwful: '#F06A5A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};
