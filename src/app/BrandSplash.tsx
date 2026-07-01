import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Typography';
import { APP } from '@/constants/app';

/**
 * Brand color that matches the native splash background in `app.json`
 * (`splash.backgroundColor`). Keeping it fixed makes the hand-off from the
 * OS splash screen to this in-app splash seamless in both light and dark mode.
 */
const BRAND_BG = '#0E7C66';
const BRAND_FG = '#FFFFFF';
const BRAND_FG_MUTED = 'rgba(255, 255, 255, 0.78)';

interface Props {
  /** Show a small spinner beneath the wordmark while the app finishes loading. */
  loading?: boolean;
}

/**
 * Full-screen animated splash that introduces the Oppuna brand with the
 * Magnolia champaca leaf logo. Shown while the app bootstraps.
 */
export function BrandSplash({ loading = true }: Props): React.ReactElement {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.4)) });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, [opacity, scale, textOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Logo size={132} color={BRAND_FG} accentColor={BRAND_BG} />
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
        <ActivityIndicator size="small" color={BRAND_FG} style={styles.spinner} />
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
  logoWrap: { marginBottom: 24 },
  textWrap: { alignItems: 'center', gap: 8, maxWidth: 320 },
  name: { color: BRAND_FG, letterSpacing: 1 },
  tagline: { color: BRAND_FG_MUTED },
  spinner: { position: 'absolute', bottom: 56 },
});
