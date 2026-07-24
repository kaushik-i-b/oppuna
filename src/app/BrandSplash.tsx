import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { LivingLeaf } from '@/ui';
import { Text } from '@/components/ui/Typography';
import { APP } from '@/constants/app';
import { logger } from '@/utils/logger';

/**
 * Brand color that matches the native splash background in `app.json`
 * (`splash.backgroundColor`). Keeping it fixed makes the hand-off from the
 * OS splash screen to this in-app splash seamless in both light and dark mode.
 */
const BRAND_BG = '#3D6B5A';
const BRAND_FG = '#FFFFFF';
const BRAND_FG_MUTED = 'rgba(255, 255, 255, 0.78)';
const BRAND_GLOW = 'rgba(255, 255, 255, 0.12)';

// Bundled offline ambient (~2.8s). Fully local — no network.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SPLASH_AUDIO = require('../../assets/audio/splash.wav');

interface Props {
  /** Show loading affordance while the app finishes bootstrapping. */
  loading?: boolean;
}

/**
 * Full-screen animated splash with soft offline ambient audio.
 * Introduces the Oppuna leaf while storage/model bootstrap completes.
 */
export function BrandSplash({ loading = true }: Props): React.ReactElement {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.82);
  const textOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.35);
  const bar = useSharedValue(0.15);

  const player = useAudioPlayer(SPLASH_AUDIO);

  useEffect(() => {
    let cancelled = false;
    let reduceMotion = false;

    const run = async (): Promise<void> => {
      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        reduceMotion = false;
      }
      if (cancelled) return;

      if (reduceMotion) {
        opacity.value = 1;
        scale.value = 1;
        textOpacity.value = 1;
        pulse.value = 1;
        glow.value = 0.5;
        bar.value = withTiming(1, { duration: 1800 });
      } else {
        opacity.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 780, easing: Easing.out(Easing.back(1.25)) });
        textOpacity.value = withDelay(280, withTiming(1, { duration: 520 }));
        pulse.value = withDelay(
          700,
          withRepeat(
            withSequence(
              withTiming(1.045, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
          ),
        );
        glow.value = withDelay(
          500,
          withRepeat(
            withSequence(
              withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
          ),
        );
        bar.value = withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) });
      }

      // Soft ambient — local only. Fail quietly on web/unsupported devices.
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: Platform.OS === 'ios' ? 'mixWithOthers' : 'duckOthers',
        });
        if (cancelled) return;
        player.volume = 0.62;
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
    // player instance is stable enough for mount/unmount lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.95 + glow.value * 0.2 }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(8, bar.value * 100))}%`,
    opacity: loading ? 0.9 : 0,
  }));

  return (
    <View style={styles.container} accessibilityLabel={`${APP.name} is starting`}>
      <Animated.View style={[styles.glow, glowStyle]} />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <LivingLeaf
          size={140}
          variant="greet"
          color={BRAND_FG}
          accentColor={BRAND_BG}
          showAura={false}
        />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text variant="display" center style={styles.name}>
          {APP.name}
        </Text>
        <Text variant="body" center style={styles.tagline}>
          {APP.tagline}
        </Text>
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
    backgroundColor: BRAND_BG,
    padding: 32,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND_GLOW,
  },
  logoWrap: { marginBottom: 24, zIndex: 1 },
  textWrap: { alignItems: 'center', gap: 8, maxWidth: 320, zIndex: 1 },
  name: { color: BRAND_FG, letterSpacing: 1 },
  tagline: { color: BRAND_FG_MUTED },
  progressTrack: {
    position: 'absolute',
    bottom: 56,
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: BRAND_FG,
  },
});
