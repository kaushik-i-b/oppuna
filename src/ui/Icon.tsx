import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';

/** Canonical Oppuna functional icons — Ionicons, one family, no structural emoji. */
export type OppunaIconName =
  | 'home'
  | 'chat'
  | 'mood'
  | 'journal'
  | 'settings'
  | 'plan'
  | 'profile'
  | 'breathe'
  | 'ground'
  | 'sleep'
  | 'selfcare'
  | 'insights'
  | 'privacy'
  | 'lock'
  | 'export'
  | 'trash'
  | 'send'
  | 'mic'
  | 'play'
  | 'pause'
  | 'back'
  | 'check'
  | 'close'
  | 'chevron'
  | 'see'
  | 'feel'
  | 'hear'
  | 'smell'
  | 'taste'
  | 'plus'
  | 'search'
  | 'shield'
  | 'info'
  | 'warning'
  | 'leaf'
  | 'bell';

const MAP: Record<OppunaIconName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  chat: 'chatbubble-ellipses-outline',
  mood: 'happy-outline',
  journal: 'book-outline',
  settings: 'settings-outline',
  plan: 'checkbox-outline',
  profile: 'person-outline',
  breathe: 'leaf-outline',
  ground: 'scan-outline',
  sleep: 'moon-outline',
  selfcare: 'heart-outline',
  insights: 'stats-chart-outline',
  privacy: 'shield-checkmark-outline',
  lock: 'lock-closed-outline',
  export: 'download-outline',
  trash: 'trash-outline',
  send: 'arrow-up',
  mic: 'mic-outline',
  play: 'play-outline',
  pause: 'pause-outline',
  back: 'chevron-back',
  check: 'checkmark',
  close: 'close',
  chevron: 'chevron-forward',
  see: 'eye-outline',
  feel: 'hand-left-outline',
  hear: 'ear-outline',
  smell: 'flower-outline',
  taste: 'restaurant-outline',
  plus: 'add',
  search: 'search-outline',
  shield: 'shield-outline',
  info: 'information-circle-outline',
  warning: 'alert-circle-outline',
  leaf: 'leaf',
  bell: 'notifications-outline',
};

interface Props {
  name: OppunaIconName;
  size?: number;
  color?: string;
  /** When true, use filled variant where available for active tab states. */
  filled?: boolean;
}

const FILLED: Partial<Record<OppunaIconName, keyof typeof Ionicons.glyphMap>> = {
  home: 'home',
  chat: 'chatbubble-ellipses',
  mood: 'happy',
  journal: 'book',
  settings: 'settings',
  plan: 'checkbox',
  profile: 'person',
  mic: 'mic',
  play: 'play',
  pause: 'pause',
};

export function Icon({ name, size = 22, color, filled }: Props): React.ReactElement {
  const theme = useTheme();
  const glyph =
    (filled ? FILLED[name] : undefined) ?? MAP[name] ?? 'ellipse-outline';
  return (
    <Ionicons
      name={glyph}
      size={size}
      color={color ?? theme.colors.text}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
