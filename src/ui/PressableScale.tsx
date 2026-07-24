import React from 'react';
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { PRESS_SCALE, softSpring } from '@/ui/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /** Target scale while pressed. Default ~0.97. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  testID?: string;
}

/**
 * Pressable with a soft scale response. Honors Reduce Motion (opacity only).
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scaleTo = PRESS_SCALE,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: Props): React.ReactElement {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pressIn = (): void => {
    if (disabled) return;
    if (reduceMotion) {
      opacity.value = withTiming(0.88, { duration: 90 });
      return;
    }
    scale.value = withSpring(scaleTo, softSpring);
  };

  const pressOut = (): void => {
    if (reduceMotion) {
      opacity.value = withTiming(1, { duration: 120 });
      return;
    }
    scale.value = withSpring(1, softSpring);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
