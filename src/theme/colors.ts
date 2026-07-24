/** Semantic color tokens shared by every Oppuna palette. */

export interface ColorScheme {
  /** App background — deep neutral; green is accent only */
  background: string;
  /** Slightly raised background (sections) */
  backgroundAlt: string;
  backgroundSecondary: string;
  /** Card / surface */
  surface: string;
  surfaceElevated: string;
  /** Surface pressed / subtle highlight */
  surfaceAlt: string;
  surfaceInteractive: string;
  surfacePressed: string;
  /** Primary brand accent */
  primary: string;
  primaryMuted: string;
  primaryPressed: string;
  onPrimary: string;
  /** Secondary accent */
  accent: string;
  accentMuted: string;
  /** Text */
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  /** Borders / dividers */
  border: string;
  /** States */
  success: string;
  warning: string;
  warningMuted: string;
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
  /** User chat bubble tint */
  chatUserBubble: string;
  /** Assistant chat bubble */
  chatAssistantBubble: string;
}

/** User-selectable brand palettes (each has light + dark). */
export type ColorPaletteId = 'sage' | 'harbor' | 'blossom' | 'slate';

export const COLOR_PALETTE_IDS: ColorPaletteId[] = ['sage', 'harbor', 'blossom', 'slate'];

export const DEFAULT_COLOR_PALETTE: ColorPaletteId = 'sage';

export interface ColorPaletteMeta {
  id: ColorPaletteId;
  /** Swatch shown in Settings (light primary). */
  swatch: string;
  light: ColorScheme;
  dark: ColorScheme;
}

const moodShared = {
  moodOkay: '#D4A84B',
  moodLow: '#E08A50',
  moodAwful: '#C0392B',
} as const;

const moodSharedDark = {
  moodOkay: '#E0B450',
  moodLow: '#E89B6B',
  moodAwful: '#F06A5A',
} as const;

/** Soft Sage + Warm Sand — Oppuna default. */
const sageLight: ColorScheme = {
  background: '#F7F4EF',
  backgroundAlt: '#EFEAE3',
  backgroundSecondary: '#F1EDE7',
  surface: '#FFFCF8',
  surfaceElevated: '#FFFFFF',
  surfaceAlt: '#F3EFE9',
  surfaceInteractive: '#FAF7F2',
  surfacePressed: '#E8E2D9',
  primary: '#3D6B5A',
  primaryMuted: '#DCE8E2',
  primaryPressed: '#2F5446',
  onPrimary: '#FFFFFF',
  accent: '#7A6FA8',
  accentMuted: '#E8E4F2',
  text: '#1C2420',
  textPrimary: '#1C2420',
  textSecondary: '#3F4A44',
  textMuted: '#5C675F',
  textFaint: '#8E9891',
  border: '#E2DCD3',
  success: '#3D6B5A',
  warning: '#B87A14',
  warningMuted: '#F7EBD4',
  danger: '#C0392B',
  dangerMuted: '#FBE6E3',
  onDanger: '#FFFFFF',
  moodGreat: '#3D6B5A',
  moodGood: '#6A9A7F',
  ...moodShared,
  overlay: 'rgba(28, 36, 32, 0.45)',
  shadow: '#1C2420',
  chatUserBubble: '#DCE8E2',
  chatAssistantBubble: '#FFFCF8',
};

const sageDark: ColorScheme = {
  background: '#121614',
  backgroundAlt: '#171C19',
  backgroundSecondary: '#1A1F1C',
  surface: '#1A211E',
  surfaceElevated: '#222A26',
  surfaceAlt: '#262E2A',
  surfaceInteractive: '#1E2622',
  surfacePressed: '#2A332E',
  primary: '#7BC4A8',
  primaryMuted: '#24352E',
  primaryPressed: '#63B094',
  onPrimary: '#0E1A16',
  accent: '#B3A8E0',
  accentMuted: '#2A2740',
  text: '#EEF2EF',
  textPrimary: '#EEF2EF',
  textSecondary: '#C5CFC9',
  textMuted: '#A8B4AD',
  textFaint: '#748079',
  border: '#2C3531',
  success: '#7BC4A8',
  warning: '#E0B450',
  warningMuted: '#3A3018',
  danger: '#F06A5A',
  dangerMuted: '#3A211E',
  onDanger: '#1A0E0C',
  moodGreat: '#7BC4A8',
  moodGood: '#8FCFB0',
  ...moodSharedDark,
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  chatUserBubble: '#24352E',
  chatAssistantBubble: '#1A211E',
};

/** Harbor — cool teal mist, calm water. */
const harborLight: ColorScheme = {
  background: '#F3F6F7',
  backgroundAlt: '#E8EEF0',
  backgroundSecondary: '#ECF1F3',
  surface: '#FBFDFF',
  surfaceElevated: '#FFFFFF',
  surfaceAlt: '#EEF3F5',
  surfaceInteractive: '#F7FAFB',
  surfacePressed: '#DDE6EA',
  primary: '#2F6F7A',
  primaryMuted: '#D5E8EC',
  primaryPressed: '#245861',
  onPrimary: '#FFFFFF',
  accent: '#5B7C99',
  accentMuted: '#E0E8F0',
  text: '#1A2428',
  textPrimary: '#1A2428',
  textSecondary: '#3A484E',
  textMuted: '#5A6A70',
  textFaint: '#8A989E',
  border: '#D5DEE2',
  success: '#2F6F7A',
  warning: '#B87A14',
  warningMuted: '#F7EBD4',
  danger: '#C0392B',
  dangerMuted: '#FBE6E3',
  onDanger: '#FFFFFF',
  moodGreat: '#2F6F7A',
  moodGood: '#5A9AA5',
  ...moodShared,
  overlay: 'rgba(26, 36, 40, 0.45)',
  shadow: '#1A2428',
  chatUserBubble: '#D5E8EC',
  chatAssistantBubble: '#FBFDFF',
};

const harborDark: ColorScheme = {
  background: '#101618',
  backgroundAlt: '#151C1F',
  backgroundSecondary: '#182024',
  surface: '#1A2327',
  surfaceElevated: '#222C31',
  surfaceAlt: '#263238',
  surfaceInteractive: '#1E282C',
  surfacePressed: '#2C3940',
  primary: '#7EC4CF',
  primaryMuted: '#1F343A',
  primaryPressed: '#63B0BC',
  onPrimary: '#0C1618',
  accent: '#9BB4C9',
  accentMuted: '#24303A',
  text: '#EDF3F5',
  textPrimary: '#EDF3F5',
  textSecondary: '#C2CED3',
  textMuted: '#A4B3B9',
  textFaint: '#708088',
  border: '#2A363C',
  success: '#7EC4CF',
  warning: '#E0B450',
  warningMuted: '#3A3018',
  danger: '#F06A5A',
  dangerMuted: '#3A211E',
  onDanger: '#1A0E0C',
  moodGreat: '#7EC4CF',
  moodGood: '#93CFD8',
  ...moodSharedDark,
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  chatUserBubble: '#1F343A',
  chatAssistantBubble: '#1A2327',
};

/** Blossom — dusty rose care, soft blush sand. */
const blossomLight: ColorScheme = {
  background: '#F8F3F2',
  backgroundAlt: '#F0E8E6',
  backgroundSecondary: '#F3EBEA',
  surface: '#FFFCFB',
  surfaceElevated: '#FFFFFF',
  surfaceAlt: '#F4ECEB',
  surfaceInteractive: '#FAF6F5',
  surfacePressed: '#E8DDDB',
  primary: '#8B5A5A',
  primaryMuted: '#EEDFDF',
  primaryPressed: '#704848',
  onPrimary: '#FFFFFF',
  accent: '#6E7A6A',
  accentMuted: '#E4E8E2',
  text: '#261E1E',
  textPrimary: '#261E1E',
  textSecondary: '#4A3E3E',
  textMuted: '#6B5C5C',
  textFaint: '#9A8A8A',
  border: '#E4D8D6',
  success: '#5F7A68',
  warning: '#B87A14',
  warningMuted: '#F7EBD4',
  danger: '#C0392B',
  dangerMuted: '#FBE6E3',
  onDanger: '#FFFFFF',
  moodGreat: '#5F7A68',
  moodGood: '#8B5A5A',
  ...moodShared,
  overlay: 'rgba(38, 30, 30, 0.45)',
  shadow: '#261E1E',
  chatUserBubble: '#EEDFDF',
  chatAssistantBubble: '#FFFCFB',
};

const blossomDark: ColorScheme = {
  background: '#161212',
  backgroundAlt: '#1C1616',
  backgroundSecondary: '#201A1A',
  surface: '#241C1C',
  surfaceElevated: '#2C2323',
  surfaceAlt: '#322929',
  surfaceInteractive: '#281F1F',
  surfacePressed: '#3A2E2E',
  primary: '#D4A0A0',
  primaryMuted: '#3A2828',
  primaryPressed: '#C48A8A',
  onPrimary: '#1A1010',
  accent: '#A8B4A4',
  accentMuted: '#2A3028',
  text: '#F3ECEC',
  textPrimary: '#F3ECEC',
  textSecondary: '#D0C4C4',
  textMuted: '#B3A4A4',
  textFaint: '#847676',
  border: '#3A2E2E',
  success: '#A8C4B0',
  warning: '#E0B450',
  warningMuted: '#3A3018',
  danger: '#F06A5A',
  dangerMuted: '#3A211E',
  onDanger: '#1A0E0C',
  moodGreat: '#A8C4B0',
  moodGood: '#D4A0A0',
  ...moodSharedDark,
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  chatUserBubble: '#3A2828',
  chatAssistantBubble: '#241C1C',
};

/** Slate — cool stone with moss accent. */
const slateLight: ColorScheme = {
  background: '#F4F5F4',
  backgroundAlt: '#E9EBE9',
  backgroundSecondary: '#EEEFEE',
  surface: '#FBFCFB',
  surfaceElevated: '#FFFFFF',
  surfaceAlt: '#EFF1EF',
  surfaceInteractive: '#F7F8F7',
  surfacePressed: '#DFE2DF',
  primary: '#4A5D52',
  primaryMuted: '#DCE3DE',
  primaryPressed: '#3A4A41',
  onPrimary: '#FFFFFF',
  accent: '#6B7380',
  accentMuted: '#E4E7EC',
  text: '#1C211F',
  textPrimary: '#1C211F',
  textSecondary: '#3D4541',
  textMuted: '#5C6560',
  textFaint: '#8A928D',
  border: '#D8DCD8',
  success: '#4A5D52',
  warning: '#B87A14',
  warningMuted: '#F7EBD4',
  danger: '#C0392B',
  dangerMuted: '#FBE6E3',
  onDanger: '#FFFFFF',
  moodGreat: '#4A5D52',
  moodGood: '#6E8578',
  ...moodShared,
  overlay: 'rgba(28, 33, 31, 0.45)',
  shadow: '#1C211F',
  chatUserBubble: '#DCE3DE',
  chatAssistantBubble: '#FBFCFB',
};

const slateDark: ColorScheme = {
  background: '#121413',
  backgroundAlt: '#171A18',
  backgroundSecondary: '#1A1D1B',
  surface: '#1C201E',
  surfaceElevated: '#252A27',
  surfaceAlt: '#2A302C',
  surfaceInteractive: '#202522',
  surfacePressed: '#323832',
  primary: '#A0B8AA',
  primaryMuted: '#26302A',
  primaryPressed: '#8AA896',
  onPrimary: '#101612',
  accent: '#A8B0BC',
  accentMuted: '#2A2E36',
  text: '#EEF1EF',
  textPrimary: '#EEF1EF',
  textSecondary: '#C6CDC8',
  textMuted: '#A8B0AB',
  textFaint: '#767E79',
  border: '#2C332E',
  success: '#A0B8AA',
  warning: '#E0B450',
  warningMuted: '#3A3018',
  danger: '#F06A5A',
  dangerMuted: '#3A211E',
  onDanger: '#1A0E0C',
  moodGreat: '#A0B8AA',
  moodGood: '#B4C8BC',
  ...moodSharedDark,
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  chatUserBubble: '#26302A',
  chatAssistantBubble: '#1C201E',
};

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPaletteMeta> = {
  sage: {
    id: 'sage',
    swatch: sageLight.primary,
    light: sageLight,
    dark: sageDark,
  },
  harbor: {
    id: 'harbor',
    swatch: harborLight.primary,
    light: harborLight,
    dark: harborDark,
  },
  blossom: {
    id: 'blossom',
    swatch: blossomLight.primary,
    light: blossomLight,
    dark: blossomDark,
  },
  slate: {
    id: 'slate',
    swatch: slateLight.primary,
    light: slateLight,
    dark: slateDark,
  },
};

export function isColorPaletteId(value: unknown): value is ColorPaletteId {
  return typeof value === 'string' && value in COLOR_PALETTES;
}

export function resolveColorScheme(
  paletteId: ColorPaletteId,
  mode: 'light' | 'dark',
): ColorScheme {
  const palette = COLOR_PALETTES[paletteId] ?? COLOR_PALETTES[DEFAULT_COLOR_PALETTE];
  return mode === 'dark' ? palette.dark : palette.light;
}

/** @deprecated Prefer resolveColorScheme — kept for ErrorBoundary fallback. */
export const lightColors = sageLight;
/** @deprecated Prefer resolveColorScheme — kept for ErrorBoundary fallback. */
export const darkColors = sageDark;
