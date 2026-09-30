import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import type { VoicePhase } from '@/voice/types';

export function VoiceOrb({ phase }: { phase: VoicePhase }): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const ring = useSharedValue(0.35);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(scale);
      cancelAnimation(ring);
      scale.value = 1;
      ring.value = phase === 'SPEAKING' || phase === 'LISTENING' ? 0.55 : 0.3;
      return;
    }
    if (phase === 'LISTENING') {
      scale.value = withRepeat(withTiming(1.06, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
      ring.value = withRepeat(withTiming(0.15, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
      return;
    }
    if (phase === 'SPEAKING') {
      scale.value = withRepeat(withTiming(1.14, { duration: 680, easing: Easing.inOut(Easing.ease) }), -1, true);
      ring.value = withRepeat(withTiming(0.08, { duration: 680, easing: Easing.inOut(Easing.ease) }), -1, true);
      return;
    }
    if (phase === 'THINKING' || phase === 'CONNECTING') {
      scale.value = withRepeat(withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
      ring.value = 0.25;
      return;
    }
    cancelAnimation(scale);
    cancelAnimation(ring);
    scale.value = withTiming(1, { duration: 220 });
    ring.value = withTiming(0.2, { duration: 220 });
  }, [phase, reduceMotion, ring, scale]);

  const coreStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value, transform: [{ scale: 1.18 }] }));

  const coreColor = phase === 'ERROR' ? theme.colors.dangerMuted : theme.colors.primary;

  return (
    <View style={styles.wrap} accessibilityElementsHidden>
      <Animated.View style={[styles.ring, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryMuted }, ringStyle]} />
      <Animated.View style={[styles.core, { backgroundColor: coreColor }, coreStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 1 },
  core: { width: 112, height: 112, borderRadius: 56 },
});
