import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { APP } from '@/constants/app';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌿',
    title: APP.name,
    body: APP.tagline,
  },
  {
    emoji: '🔒',
    title: 'Private by design',
    body: 'No account, no cloud, no tracking. Everything you share stays on this device — even in airplane mode.',
  },
  {
    emoji: '🫶',
    title: 'Gentle, everyday support',
    body: 'Talk things through, track your mood, journal, breathe, and find grounding — at your own pace.',
  },
];

const { width } = Dimensions.get('window');

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const handleNext = (): void => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
      setIndex(index + 1);
    } else {
      navigation.navigate('Language');
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width, padding: theme.spacing.xl }]}>
            <Text variant="display" center style={styles.emoji}>
              {slide.emoji}
            </Text>
            <Text variant="title" center>
              {slide.title}
            </Text>
            <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.md }}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.dots, { marginBottom: theme.spacing.lg }]}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? theme.colors.primary : theme.colors.border,
                width: i === index ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={{ padding: theme.spacing.xl, paddingTop: 0 }}>
        <Button
          label={index === SLIDES.length - 1 ? 'Get started' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 72, marginBottom: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
