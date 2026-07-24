import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Logo } from '@/components/ui/Logo';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

export type LivingLeafVariant =
  | 'idle'
  | 'greet'
  | 'thinking'
  | 'breathe'
  | 'ground'
  | 'sleep'
  | 'outline'
  | 'celebrate';

interface Props {
  size?: number;
  variant?: LivingLeafVariant;
  /** Override leaf fill (e.g. splash white on sage). */
  color?: string;
  /** Override midrib / bud color. */
  accentColor?: string;
  /** Show a soft aura behind the leaf. Default true for expressive variants. */
  showAura?: boolean;
  /** When true, skip motion (also respects system Reduce Motion). */
  reduceMotion?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const soft = Easing.inOut(Easing.sin);

/**
 * Oppuna Living Leaf mascot — proprietary champaca leaf with calm organic motion.
 * Float, sway, breathe, and celebrate; never cartoon-bouncy.
 */
export function LivingLeaf({
  size = 72,
  variant = 'idle',
  color,
  accentColor,
  showAura,
  reduceMotion: reduceMotionProp,
  style,
  accessibilityLabel = 'Oppuna',
}: Props): React.ReactElement {
  const theme = useTheme();
  const systemReduceMotion = useReduceMotion();
  const reduceMotion = reduceMotionProp ?? systemReduceMotion;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const aura = useSharedValue(0.35);

  const wantsAura =
    showAura ?? (variant !== 'outline' && variant !== 'sleep');

  // Small leaves need bigger motion or it reads as static.
  const motionScale = size < 48 ? 1.55 : size < 64 ? 1.25 : 1;

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(rotate);
    cancelAnimation(aura);

    if (reduceMotion) {
      scale.value = 1;
      translateY.value = 0;
      rotate.value = 0;
      aura.value = wantsAura ? 0.4 : 0;
      opacity.value = variant === 'outline' || variant === 'sleep' ? 0.55 : 1;
      return;
    }

    const floatLoop = (amp: number, duration: number): void => {
      const a = amp * motionScale;
      translateY.value = withRepeat(
        withSequence(
          withTiming(-a, { duration, easing: soft }),
          withTiming(a * 0.35, { duration, easing: soft }),
        ),
        -1,
        true,
      );
    };

    const swayLoop = (deg: number, duration: number): void => {
      const d = deg * motionScale;
      rotate.value = withRepeat(
        withSequence(
          withTiming(d, { duration, easing: soft }),
          withTiming(-d, { duration, easing: soft }),
        ),
        -1,
        true,
      );
    };

    const auraLoop = (min: number, max: number, duration: number): void => {
      aura.value = withRepeat(
        withSequence(
          withTiming(max, { duration, easing: soft }),
          withTiming(min, { duration, easing: soft }),
        ),
        -1,
        false,
      );
    };

    if (variant === 'greet') {
      // Friendly nod + settle into a soft idle float.
      scale.value = withSequence(
        withTiming(0.92, { duration: 0 }),
        withTiming(1.08, { duration: 420, easing: Easing.out(Easing.back(1.4)) }),
        withTiming(1, { duration: 360, easing: soft }),
      );
      rotate.value = withSequence(
        withTiming(-10, { duration: 280, easing: soft }),
        withTiming(8, { duration: 320, easing: soft }),
        withTiming(-4, { duration: 280, easing: soft }),
        withTiming(0, { duration: 320, easing: soft }),
        withDelay(
          80,
          withRepeat(
            withSequence(
              withTiming(3.5, { duration: 2200, easing: soft }),
              withTiming(-3.5, { duration: 2200, easing: soft }),
            ),
            -1,
            true,
          ),
        ),
      );
      translateY.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 2400, easing: soft }),
            withTiming(1.5, { duration: 2400, easing: soft }),
          ),
          -1,
          true,
        ),
      );
      opacity.value = withTiming(1, { duration: 200 });
      auraLoop(0.3, 0.65, 1800);
      return;
    }

    if (variant === 'thinking') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 850, easing: soft }),
          withTiming(1, { duration: 850, easing: soft }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.72, { duration: 850, easing: soft }),
          withTiming(1, { duration: 850, easing: soft }),
        ),
        -1,
        false,
      );
      swayLoop(7, 900);
      floatLoop(3, 1000);
      auraLoop(0.25, 0.55, 900);
      return;
    }

    if (variant === 'breathe') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 4000, easing: soft }),
          withTiming(1.2, { duration: 1400 }),
          withTiming(1, { duration: 4000, easing: soft }),
        ),
        -1,
        false,
      );
      opacity.value = 1;
      swayLoop(2.5, 2800);
      translateY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 4000, easing: soft }),
          withTiming(-6, { duration: 1400 }),
          withTiming(0, { duration: 4000, easing: soft }),
        ),
        -1,
        false,
      );
      auraLoop(0.28, 0.7, 2700);
      return;
    }

    if (variant === 'ground') {
      // Rooted — less float, steady pulse.
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 750, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 750, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
      translateY.value = withTiming(0, { duration: 300 });
      rotate.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 1600, easing: soft }),
          withTiming(-2, { duration: 1600, easing: soft }),
        ),
        -1,
        true,
      );
      opacity.value = 1;
      auraLoop(0.35, 0.55, 1400);
      return;
    }

    if (variant === 'celebrate') {
      scale.value = withSequence(
        withTiming(0.88, { duration: 120 }),
        withTiming(1.18, { duration: 340, easing: Easing.out(Easing.back(1.6)) }),
        withTiming(1, { duration: 420, easing: soft }),
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 900, easing: soft }),
            withTiming(1, { duration: 900, easing: soft }),
          ),
          -1,
          false,
        ),
      );
      rotate.value = withSequence(
        withTiming(-12, { duration: 180 }),
        withTiming(12, { duration: 220 }),
        withTiming(-6, { duration: 200 }),
        withTiming(0, { duration: 260 }),
        withRepeat(
          withSequence(
            withTiming(4, { duration: 1600, easing: soft }),
            withTiming(-4, { duration: 1600, easing: soft }),
          ),
          -1,
          true,
        ),
      );
      floatLoop(5, 1600);
      opacity.value = 1;
      aura.value = withSequence(
        withTiming(0.85, { duration: 280 }),
        withRepeat(
          withSequence(
            withTiming(0.55, { duration: 1000, easing: soft }),
            withTiming(0.35, { duration: 1000, easing: soft }),
          ),
          -1,
          false,
        ),
      );
      return;
    }

    if (variant === 'sleep') {
      scale.value = withRepeat(
        withSequence(
          withTiming(0.96, { duration: 3200, easing: soft }),
          withTiming(1, { duration: 3200, easing: soft }),
        ),
        -1,
        false,
      );
      opacity.value = withTiming(0.55, { duration: 400 });
      translateY.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 3200, easing: soft }),
          withTiming(0, { duration: 3200, easing: soft }),
        ),
        -1,
        false,
      );
      rotate.value = withTiming(6, { duration: 800, easing: soft });
      aura.value = withTiming(0.15, { duration: 400 });
      return;
    }

    if (variant === 'outline') {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.5, { duration: 200 });
      floatLoop(2.5, 2800);
      swayLoop(2, 3000);
      aura.value = withTiming(0, { duration: 200 });
      return;
    }

    // idle — signature living mascot
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200, easing: soft }),
        withTiming(1, { duration: 2200, easing: soft }),
      ),
      -1,
      false,
    );
    opacity.value = withTiming(1, { duration: 200 });
    floatLoop(6, 2200);
    swayLoop(6, 2400);
    auraLoop(0.32, 0.62, 2000);
  }, [variant, reduceMotion, wantsAura, motionScale, scale, opacity, translateY, rotate, aura]);

  const leafStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    opacity: aura.value,
    transform: [{ scale: 0.85 + aura.value * 0.35 }],
  }));

  const leafColor =
    color ??
    (variant === 'outline'
      ? theme.colors.border
      : variant === 'sleep'
        ? theme.colors.textFaint
        : theme.colors.primary);
  // Cream veins read clearly on sage; white midrib can wash out on small leaves.
  const budColor = accentColor ?? theme.colors.surfaceElevated;
  // Always use primary for aura so it stays visible on primaryMuted surfaces.
  const auraColor = color ?? theme.colors.primary;

  return (
    <View
      style={[
        styles.wrap,
        { width: size * 1.55, height: size * 1.55, overflow: 'visible' },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {wantsAura && !reduceMotion ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.aura,
            {
              width: size * 1.25,
              height: size * 1.25,
              borderRadius: size * 0.625,
              backgroundColor: auraColor,
            },
            auraStyle,
          ]}
        />
      ) : null}
      <Animated.View style={leafStyle}>
        <Logo size={size} color={leafColor} accentColor={budColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
  },
});
