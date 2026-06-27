import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected = false, onPress, accessibilityHint }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();

  return (
    <Pressable
      onPress={() => {
        selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={accessibilityHint}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <Text
        variant="caption"
        style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, alignSelf: 'flex-start' },
});
