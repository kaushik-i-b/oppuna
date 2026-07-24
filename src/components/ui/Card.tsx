import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from '@/ui';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  padded = true,
  elevated = true,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props): React.ReactElement {
  const theme = useTheme();

  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padded ? theme.spacing.lg : 0,
    borderWidth: theme.mode === 'dark' ? StyleSheet.hairlineWidth : 0,
    borderColor: theme.colors.border,
    ...(elevated ? theme.shadow : {}),
  };

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[base, style]}
      >
        {children}
      </PressableScale>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
