import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { MOODS } from '@/constants/moods';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import type { MoodKey } from '@/types';

interface Props {
  value: MoodKey | null;
  onChange: (mood: MoodKey) => void;
}

export function MoodPicker({ value, onChange }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();

  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const selected = value === mood.key;
        return (
          <Pressable
            key={mood.key}
            onPress={() => {
              selection();
              onChange(mood.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={mood.label}
            style={[
              styles.item,
              {
                backgroundColor: selected ? theme.colors[mood.colorKey] : theme.colors.surface,
                borderColor: selected ? theme.colors[mood.colorKey] : theme.colors.border,
                borderRadius: theme.radius.lg,
                paddingVertical: theme.spacing.md,
              },
            ]}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text
              variant="label"
              style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted }}
            >
              {mood.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: { flex: 1, alignItems: 'center', borderWidth: 1, gap: 4 },
  emoji: { fontSize: 26 },
});
