import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  haptic = true,
  accessibilityHint,
  style,
}: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary },
    secondary: { bg: theme.colors.surfaceAlt, fg: theme.colors.text, border: theme.colors.border },
    ghost: { bg: 'transparent', fg: theme.colors.primary },
    danger: { bg: theme.colors.danger, fg: theme.colors.onDanger },
  };
  const colors = palette[variant];

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        if (haptic) selection();
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border ?? 'transparent',
          borderWidth: colors.border ? StyleSheet.hairlineWidth * 2 : 0,
          borderRadius: theme.radius.md,
          paddingVertical: size === 'lg' ? 16 : 12,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <Text variant="bodyStrong" style={{ color: colors.fg }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  fullWidth: { alignSelf: 'stretch' },
});
