import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { APP } from '@/constants/app';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import { FadeInView, Icon, LivingLeaf, softSpring, type LivingLeafVariant, type OppunaIconName } from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface ToolPoint {
  icon: OppunaIconName;
  title: string;
  body: string;
}

interface Slide {
  id: string;
  title: string;
  body: string;
  leafVariant: LivingLeafVariant;
  eyebrow?: string;
  tools?: ToolPoint[];
  note?: string;
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    eyebrow: 'WELCOME',
    title: APP.name,
    body: 'A private space to notice how you feel, untangle hard thoughts, and calm your body — at your pace.',
    leafVariant: 'greet',
  },
  {
    id: 'cbt',
    eyebrow: 'A SIMPLE IDEA',
    title: 'Thoughts shape feelings',
    body:
      'When something hard happens, the story your mind tells can make it heavier. ' +
      'CBT is a gentle way to notice that story, test it kindly, and choose a smaller next step.',
    leafVariant: 'thinking',
    note: 'Oppuna uses CBT-inspired tools for everyday reflection — not therapy or diagnosis.',
  },
  {
    id: 'tools',
    eyebrow: 'HOW OPPUNA HELPS',
    title: 'Four gentle tools',
    body: 'You do not have to use everything. One small step is enough.',
    leafVariant: 'idle',
    tools: [
      {
        icon: 'mood',
        title: 'Notice',
        body: 'Check in with your mood so patterns become visible.',
      },
      {
        icon: 'journal',
        title: 'Name the thought',
        body: 'Write a thought record to separate what happened from what your mind concluded.',
      },
      {
        icon: 'chat',
        title: 'Soften it',
        body: 'Talk it through privately and explore a kinder, more realistic view.',
      },
      {
        icon: 'breathe',
        title: 'Calm the body',
        body: 'Breathe, ground, or wind down so thinking gets a little easier.',
      },
    ],
  },
  {
    id: 'privacy',
    eyebrow: 'YOUR SPACE',
    title: 'Private by design',
    body:
      'No account, no cloud, no tracking. Everything you share stays on this device — even in airplane mode.',
    leafVariant: 'outline',
  },
  {
    id: 'boundary',
    eyebrow: 'IMPORTANT',
    title: 'Support, not therapy',
    body:
      'Oppuna is a wellness companion for everyday reflection. It does not diagnose, treat, or replace professional care. If you are in danger, it will point you toward real-world help.',
    leafVariant: 'ground',
    note: 'You are in control. Skip anything that does not feel right.',
  },
];

const { width } = Dimensions.get('window');

function Dot({
  active,
  color,
  inactiveColor,
}: {
  active: boolean;
  color: string;
  inactiveColor: string;
}): React.ReactElement {
  const reduceMotion = useReduceMotion();
  const widthAnim = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    if (reduceMotion) {
      widthAnim.value = active ? 24 : 8;
      return;
    }
    widthAnim.value = withSpring(active ? 24 : 8, softSpring);
  }, [active, reduceMotion, widthAnim]);

  const style = useAnimatedStyle(() => ({
    width: widthAnim.value,
    backgroundColor: active ? color : inactiveColor,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

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
          <ScrollView
            key={slide.id}
            style={{ width }}
            contentContainerStyle={[
              styles.slideContent,
              { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <FadeInView delay={60} preset="soft">
              <LivingLeaf
                size={slide.tools ? 64 : 80}
                variant={slide.leafVariant}
                style={{ marginBottom: theme.spacing.md }}
              />
            </FadeInView>

            <FadeInView delay={120}>
              {slide.eyebrow ? (
                <Text
                  variant="label"
                  color="primary"
                  center
                  style={{ letterSpacing: 1.2, marginBottom: theme.spacing.sm }}
                >
                  {slide.eyebrow}
                </Text>
              ) : null}
              <Text variant="title" center>
                {slide.title}
              </Text>
              <Text
                variant="body"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.md, maxWidth: 340 }}
              >
                {slide.body}
              </Text>
            </FadeInView>

            {slide.tools ? (
              <FadeInView delay={180} style={{ width: '100%', marginTop: theme.spacing.xl }}>
                <View
                  style={[
                    styles.toolsCard,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.md,
                    },
                  ]}
                >
                  {slide.tools.map((tool, toolIndex) => (
                    <View
                      key={tool.title}
                      style={[
                        styles.toolRow,
                        {
                          paddingVertical: theme.spacing.md,
                          borderBottomWidth:
                            toolIndex < (slide.tools?.length ?? 0) - 1
                              ? StyleSheet.hairlineWidth
                              : 0,
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toolIcon,
                          { backgroundColor: theme.colors.primaryMuted },
                        ]}
                      >
                        <Icon name={tool.icon} size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                        <Text variant="bodyStrong">{tool.title}</Text>
                        <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                          {tool.body}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </FadeInView>
            ) : null}

            {slide.note ? (
              <FadeInView delay={220}>
                <View
                  style={[
                    styles.note,
                    {
                      marginTop: theme.spacing.lg,
                      backgroundColor: theme.colors.primaryMuted,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                    },
                  ]}
                >
                  <Text variant="caption" color="textSecondary" center>
                    {slide.note}
                  </Text>
                </View>
              </FadeInView>
            ) : null}
          </ScrollView>
        ))}
      </ScrollView>

      <View style={[styles.dots, { marginBottom: theme.spacing.lg }]}>
        {SLIDES.map((slide, i) => (
          <Dot
            key={slide.id}
            active={i === index}
            color={theme.colors.primary}
            inactiveColor={theme.colors.border}
          />
        ))}
      </View>

      <View style={{ padding: theme.spacing.xl, paddingTop: 0 }}>
        <Button
          label={index === SLIDES.length - 1 ? 'Continue' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slideContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  toolsCard: { width: '100%', borderWidth: StyleSheet.hairlineWidth },
  toolRow: { flexDirection: 'row', alignItems: 'flex-start' },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { maxWidth: 340, alignSelf: 'center' },
});
