import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Screen, SectionHeader, Text } from '@/components';
import { APP } from '@/constants/app';
import { MOOD_BY_KEY } from '@/constants/moods';
import { moodRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { relativeDay } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { MoodEntry } from '@/types';

interface QuickAction {
  key: string;
  emoji: string;
  label: string;
  onPress: () => void;
}

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export function HomeScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      moodRepository
        .list(1)
        .then((entries) => {
          if (active) setLatestMood(entries[0] ?? null);
        })
        .catch((error) => logger.warn('Home mood load failed', { error: String(error) }));
      return () => {
        active = false;
      };
    }, []),
  );

  const actions: QuickAction[] = [
    { key: 'talk', emoji: '💬', label: t('home.talk'), onPress: () => navigation.navigate('Main', { screen: 'Chat' }) },
    { key: 'mood', emoji: '🌤️', label: t('home.logMood'), onPress: () => navigation.navigate('Main', { screen: 'Mood' }) },
    { key: 'breathe', emoji: '🫁', label: t('home.breathe'), onPress: () => navigation.navigate('Breathing') },
    { key: 'ground', emoji: '🌍', label: t('home.ground'), onPress: () => navigation.navigate('Grounding') },
    { key: 'sleep', emoji: '🌙', label: t('home.sleep'), onPress: () => navigation.navigate('Sleep') },
    { key: 'selfcare', emoji: '🧺', label: t('home.selfCare'), onPress: () => navigation.navigate('SelfCare') },
    { key: 'journal', emoji: '📓', label: t('tabs.journal'), onPress: () => navigation.navigate('Main', { screen: 'Journal' }) },
    { key: 'insights', emoji: '📈', label: t('home.insights'), onPress: () => navigation.navigate('Insights') },
  ];

  return (
    <Screen scroll>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textMuted">
          {APP.name}
        </Text>
        <Text variant="title">{t(greetingKey())}</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
          {t('home.howAreYou')}
        </Text>
      </View>

      <Card
        onPress={() => navigation.navigate('Main', { screen: 'Mood' })}
        accessibilityLabel={t('home.logMood')}
        style={{ marginBottom: theme.spacing.xl }}
      >
        <View style={styles.moodRow}>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle">
              {latestMood ? `${MOOD_BY_KEY[latestMood.mood].emoji}  ${MOOD_BY_KEY[latestMood.mood].label}` : t('home.logMood')}
            </Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
              {latestMood ? `Last check-in · ${relativeDay(latestMood.createdAt)}` : 'Tap to record how you feel'}
            </Text>
          </View>
          <Text variant="title" color="primary">
            +
          </Text>
        </View>
      </Card>

      <SectionHeader title={t('home.quickActions')} />
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                borderColor: theme.colors.border,
                ...theme.shadow,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.tileEmoji}>{action.emoji}</Text>
            <Text variant="caption" color="text" center style={{ fontWeight: '600' }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  moodRow: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    aspectRatio: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0,
  },
  tileEmoji: { fontSize: 30 },
});
