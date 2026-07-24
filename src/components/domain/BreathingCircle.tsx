import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

export type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

interface Props {
  phase: BreathPhase;
  /** Duration of the current phase in milliseconds. */
  durationMs: number;
  label: string;
  caption?: string;
}

const SIZE = 200;

/**
 * Soft expanding orb for guided breathing — calm scale + aura, label below for clarity.
 */
export function BreathingCircle({ phase, durationMs, label, caption }: Props): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(0.62);
  const aura = useSharedValue(0.32);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.62 : 0.82;
      aura.value = 0.38;
      return;
    }

    const target =
      phase === 'inhale' ? 1 : phase === 'exhale' ? 0.62 : phase === 'hold' ? scale.value : 0.62;
    const duration = phase === 'hold' ? 0 : Math.max(durationMs, 1);

    scale.value = withTiming(target, {
      duration,
      easing: Easing.inOut(Easing.sin),
    });
    aura.value = withTiming(phase === 'inhale' ? 0.5 : phase === 'exhale' ? 0.24 : 0.38, {
      duration: phase === 'hold' ? 400 : duration,
      easing: Easing.inOut(Easing.sin),
    });
  }, [phase, durationMs, reduceMotion, scale, aura]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    opacity: aura.value,
    transform: [{ scale: 0.9 + scale.value * 0.28 }],
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}. ${caption ?? ''}`}
    >
      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.aura,
            {
              backgroundColor: theme.colors.primary,
              width: SIZE * 1.35,
              height: SIZE * 1.35,
              borderRadius: (SIZE * 1.35) / 2,
            },
            auraStyle,
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              borderColor: theme.colors.primary,
              width: SIZE + 18,
              height: SIZE + 18,
              borderRadius: (SIZE + 18) / 2,
            },
          ]}
        />
        <Animated.View
          style={[
            {
              backgroundColor: theme.colors.primary,
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
            },
            orbStyle,
          ]}
        />
      </View>

      <Text
        variant="heading"
        center
        style={{
          color: theme.colors.primary,
          letterSpacing: 0.5,
          marginTop: theme.spacing.xl,
        }}
      >
        {label}
      </Text>
      {caption ? (
        <Text
          variant="title"
          center
          style={{
            color: theme.colors.text,
            marginTop: 4,
          }}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  stage: {
    width: SIZE * 1.45,
    height: SIZE * 1.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: { position: 'absolute' },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    opacity: 0.28,
  },
});
