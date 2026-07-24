import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  label: string;
  tone?: 'neutral' | 'primary' | 'warning' | 'success';
  leading?: React.ReactNode;
}

export function StatusPill({ label, tone = 'neutral', leading }: Props): React.ReactElement {
  const theme = useTheme();
  const palette = {
    neutral: {
      bg: theme.colors.surfaceAlt,
      fg: theme.colors.textMuted,
      dot: theme.colors.textFaint,
    },
    primary: {
      bg: theme.colors.primaryMuted,
      fg: theme.colors.primary,
      dot: theme.colors.primary,
    },
    warning: {
      bg: theme.colors.warningMuted,
      fg: theme.colors.warning,
      dot: theme.colors.warning,
    },
    success: {
      bg: theme.colors.primaryMuted,
      fg: theme.colors.success,
      dot: theme.colors.success,
    },
  }[tone];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          gap: theme.spacing.sm,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {leading ?? (
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      )}
      <Text variant="caption" style={{ color: palette.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
