import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

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
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && { opacity: 0.9 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
