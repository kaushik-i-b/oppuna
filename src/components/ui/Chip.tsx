import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale, softSpring } from '@/ui';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

export function Chip({ label, selected = false, onPress, accessibilityHint }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const reduceMotion = useReduceMotion();
  const selectScale = useSharedValue(selected ? 1.04 : 1);

  useEffect(() => {
    if (reduceMotion) {
      selectScale.value = 1;
      return;
    }
    selectScale.value = withSpring(selected ? 1.04 : 1, softSpring);
  }, [selected, reduceMotion, selectScale]);

  const selectedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectScale.value }],
  }));

  return (
    <Animated.View style={selectedStyle}>
      <PressableScale
        onPress={() => {
          selection();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
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
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, alignSelf: 'flex-start' },
});
