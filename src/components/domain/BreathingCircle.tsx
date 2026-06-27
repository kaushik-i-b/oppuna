import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

export type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

interface Props {
  phase: BreathPhase;
  /** Duration of the current phase in milliseconds. */
  durationMs: number;
  label: string;
  caption?: string;
}

const SIZE = 240;

export function BreathingCircle({ phase, durationMs, label, caption }: Props): React.ReactElement {
  const theme = useTheme();
  const scale = useSharedValue(0.6);

  useEffect(() => {
    const target = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.6 : phase === 'hold' ? scale.value : 0.6;
    scale.value = withTiming(target, {
      duration: phase === 'hold' ? 0 : durationMs,
      easing: Easing.inOut(Easing.ease),
    });
  }, [phase, durationMs, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.35 + scale.value * 0.4,
  }));

  return (
    <View style={styles.container} accessibilityLabel={`${label}. ${caption ?? ''}`}>
      <View style={[styles.ring, { borderColor: theme.colors.primaryMuted }]}>
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: theme.colors.primary },
            animatedStyle,
          ]}
        />
        <View style={styles.labelWrap} pointerEvents="none">
          <Text variant="heading" style={{ color: theme.colors.onPrimary }}>
            {label}
          </Text>
          {caption ? (
            <Text variant="caption" style={{ color: theme.colors.onPrimary }}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  labelWrap: { alignItems: 'center', gap: 2 },
});
