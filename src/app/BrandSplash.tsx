import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { LivingLeaf } from '@/ui';
import { APP } from '@/constants/app';
import { logger } from '@/utils/logger';

/** Matches native splash `backgroundColor` in app.json for a seamless handoff. */
const BRAND = '#3D6B5A';
const BRAND_DEEP = '#2F5446';
const FG = '#FFFFFF';

const TITLE = 'Oppuna';
const TAGLINE = 'Private AI for your thoughts';

const SPLASH_AUDIO = require('../../assets/audio/splash.wav');

/** Long enough for leaf + name + tagline to read before home. */
export const SPLASH_DURATION_MS = 2600;

const FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

interface Props {
  loading?: boolean;
}

/**
 * Calm brand splash: Soft Sage field, Living Leaf, wordmark.
 * No particles, neon bloom, or fake-3D glass.
 */
export function BrandSplash({ loading = true }: Props): React.ReactElement {
  const enter = useSharedValue(0);
  const breath = useSharedValue(1);
  const bar = useSharedValue(0.15);

  const player = useAudioPlayer(SPLASH_AUDIO);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      let reduceMotion = false;
      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        reduceMotion = false;
      }
      if (cancelled) return;

      if (reduceMotion) {
        enter.value = 1;
        breath.value = 1;
        bar.value = withTiming(1, { duration: 1400 });
      } else {
        enter.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
        breath.value = withDelay(
          500,
          withRepeat(
            withSequence(
              withTiming(1.03, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
          ),
        );
        bar.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) });
      }

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: Platform.OS === 'ios' ? 'mixWithOthers' : 'duckOthers',
        });
        if (cancelled) return;
        player.volume = 0.38;
        player.play();
      } catch (error) {
        logger.warn('Splash audio unavailable', { error: String(error) });
      }
    };

    void run();

    return () => {
      cancelled = true;
      try {
        player.pause();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaf + name + tagline fade in together (one composition, no staged leaf-only beat).
  const markStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.45, 1], [0, 1, 1]),
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [10, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.94, 1]) * breath.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.45, 1], [0, 1, 1]),
    transform: [{ translateY: interpolate(enter.value, [0, 1], [10, 0]) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.45, 1], [0, 1, 1]),
    transform: [{ translateY: interpolate(enter.value, [0, 1], [10, 0]) }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(12, bar.value * 100))}%`,
    opacity: loading ? 0.9 : 0,
  }));

  return (
    <View style={styles.container} accessibilityLabel={`${APP.name} is starting`}>
      <View style={styles.wash} />

      <Animated.View style={[styles.mark, markStyle]}>
        <LivingLeaf
          size={112}
          variant="greet"
          color={FG}
          accentColor={BRAND_DEEP}
          showAura={false}
        />
      </Animated.View>

      <Animated.View style={titleStyle}>
        <Text style={styles.title}>{TITLE}</Text>
      </Animated.View>

      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>{TAGLINE}</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.progressTrack} accessibilityRole="progressbar">
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND,
    paddingHorizontal: 40,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mark: {
    marginBottom: 28,
  },
  title: {
    fontFamily: FONT,
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: FG,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 10,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 56,
    width: 88,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: FG,
  },
});
