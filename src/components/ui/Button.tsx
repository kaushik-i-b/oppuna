import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import { PRESS_SCALE_SOFT, PressableScale } from '@/ui';

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

type Tone = {
  bg: string;
  fg: string;
  /** Soft outer glow — tinted, not Material elevation. */
  glow?: string;
  /** Quiet top sheen for primary only. */
  sheen?: string;
};

/**
 * Oppuna care CTA — soft sage / warm sand, not a generic kit button.
 * Letter-spaced label, muted secondary & danger, no hairline “outline” look.
 */
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
  const isDark = theme.mode === 'dark';
  const tall = size === 'lg';

  const tones: Record<ButtonVariant, Tone> = {
    primary: {
      bg: theme.colors.primary,
      fg: theme.colors.onPrimary,
      glow: theme.colors.primary,
      sheen: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,252,248,0.18)',
    },
    secondary: {
      bg: theme.colors.primaryMuted,
      fg: theme.colors.primary,
    },
    ghost: {
      bg: 'transparent',
      fg: theme.colors.textMuted,
    },
    danger: {
      bg: theme.colors.dangerMuted,
      fg: theme.colors.danger,
    },
  };
  const tone = tones[variant];
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <PressableScale
      onPress={() => {
        if (isDisabled) return;
        if (haptic) selection();
        onPress();
      }}
      disabled={isDisabled}
      scaleTo={PRESS_SCALE_SOFT}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        {
          backgroundColor: tone.bg,
          borderRadius: theme.radius.lg,
          paddingVertical: isGhost ? (tall ? 14 : 10) : tall ? 17 : 13,
          paddingHorizontal: theme.spacing.xl,
          minHeight: isGhost ? 44 : tall ? 54 : 46,
          opacity: isDisabled ? 0.45 : 1,
          ...(isPrimary && !isDisabled
            ? {
                shadowColor: tone.glow,
                shadowOpacity: isDark ? 0.35 : 0.22,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 0,
              }
            : null),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {isPrimary && tone.sheen ? (
        <View
          pointerEvents="none"
          style={[
            styles.sheen,
            {
              backgroundColor: tone.sheen,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            },
          ]}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <Text
          variant="bodyStrong"
          style={{
            color: tone.fg,
            letterSpacing: isGhost ? 0.8 : 0.55,
            fontWeight: isGhost ? '500' : '600',
            fontSize: tall ? theme.fontSize.md : theme.fontSize.sm,
          }}
        >
          {label}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
});
