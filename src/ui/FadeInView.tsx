import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { enter } from '@/ui/motion';

type Preset = 'fade' | 'rise' | 'lift' | 'soft';

interface Props {
  children: React.ReactNode;
  /** Delay before enter animation starts (ms). */
  delay?: number;
  preset?: Preset;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gentle enter wrapper for screen sections. No-ops when Reduce Motion is on.
 */
export function FadeInView({
  children,
  delay = 0,
  preset = 'rise',
  style,
}: Props): React.ReactElement {
  const reduceMotion = useReduceMotion();

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View entering={enter[preset](delay)} style={style}>
      {children}
    </Animated.View>
  );
}
