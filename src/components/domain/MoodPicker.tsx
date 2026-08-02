import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { MOODS } from '@/constants/moods';
import { useHaptics } from '@/hooks/useHaptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { MoodMark, PressableScale, softSpring, stagger } from '@/ui';
import { FadeInView } from '@/ui/FadeInView';
import type { MoodKey } from '@/types';

interface Props {
  value: MoodKey | null;
  onChange: (mood: MoodKey) => void;
}

function tint(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function MoodOption({
  mood,
  selected,
  onPress,
  delay,
}: {
  mood: (typeof MOODS)[number];
  selected: boolean;
  onPress: () => void;
  delay: number;
}): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const selectScale = useSharedValue(selected ? 1.05 : 1);
  const accent = theme.colors[mood.colorKey];

  useEffect(() => {
    if (reduceMotion) {
      selectScale.value = 1;
      return;
    }
    selectScale.value = withSpring(selected ? 1.05 : 1, softSpring);
  }, [selected, reduceMotion, selectScale]);

  const selectedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectScale.value }],
  }));

  return (
    <FadeInView delay={delay} preset="soft" style={styles.itemWrap}>
      <Animated.View style={[{ flex: 1 }, selectedStyle]}>
        <PressableScale
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={mood.label}
          style={[
            styles.item,
            {
              backgroundColor: selected ? accent : tint(accent, theme.mode === 'dark' ? 0.18 : 0.12),
              borderColor: selected ? accent : tint(accent, 0.35),
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.md,
            },
          ]}
        >
          <MoodMark
            mood={mood.key}
            size={30}
            color={selected ? theme.colors.onPrimary : accent}
          />
          <Text
            variant="label"
            style={{
              color: selected ? theme.colors.onPrimary : theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {mood.label}
          </Text>
        </PressableScale>
      </Animated.View>
    </FadeInView>
  );
}

export function MoodPicker({ value, onChange }: Props): React.ReactElement {
  const { selection } = useHaptics();

  return (
    <View style={styles.row}>
      {MOODS.map((mood, index) => (
        <MoodOption
          key={mood.key}
          mood={mood}
          selected={value === mood.key}
          delay={stagger(index, 40)}
          onPress={() => {
            selection();
            onChange(mood.key);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  itemWrap: { flex: 1 },
  item: { flex: 1, alignItems: 'center', borderWidth: 1.5, gap: 6 },
});
