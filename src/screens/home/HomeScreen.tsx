import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Screen, Text } from '@/components';
import { MOOD_BY_KEY } from '@/constants/moods';
import { moodRepository } from '@/database';
import { computeWeeklyInsights } from '@/database/repositories/moodRepository';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import { getCareStreak, type CareStreakState } from '@/services/careRetentionService';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, Icon, LivingLeaf } from '@/ui';
import { logger } from '@/utils/logger';
import {
  computeWellnessScore,
  generateTodayPlan,
  getTodayPlan,
  planProgress,
} from '@/wellness/planService';
import type { WellnessPlan } from '@/wellness/types';
import type { MoodEntry } from '@/types';

function greetingKey(now = new Date()): TranslationKey {
  const hour = now.getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export function HomeScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const displayName = useSettingsStore((s) => s.displayName);
  const [greeting, setGreeting] = useState<TranslationKey>(() => greetingKey());
  const [plan, setPlan] = useState<WellnessPlan | null>(null);
  const [streak, setStreak] = useState<CareStreakState | null>(null);
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [moodTrend, setMoodTrend] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const refresh = useCallback(() => {
    let active = true;
    setGreeting(greetingKey());
    (async () => {
      try {
        let today = await getTodayPlan();
        if (!today) {
          today = await generateTodayPlan({ personalize: false });
        }
        const [streakState, moods] = await Promise.all([
          getCareStreak(),
          moodRepository.list(50),
        ]);
        if (!active) return;
        const insight = computeWeeklyInsights(moods);
        setPlan(today);
        setStreak(streakState);
        setLatestMood(moods[0] ?? null);
        setMoodTrend(insight.averageScore);
        setScore(
          computeWellnessScore({
            streak: streakState.currentStreak,
            plan: today,
            moodAverage: insight.averageScore,
          }),
        );
      } catch (error) {
        logger.error('Home refresh failed', { error: String(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => refresh(), [refresh]),
  );

  const progress = plan ? planProgress(plan) : null;
  const namePart = displayName.trim() ? `, ${displayName.trim()}` : '';

  return (
    <Screen scroll>
      <FadeInView delay={20} preset="soft">
        <View style={styles.hero}>
          <LivingLeaf size={56} variant="greet" />
          <Text variant="title" style={{ marginTop: theme.spacing.md }}>
            {t(greeting)}
            {namePart}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            {t('home.wellnessSubtitle')}
          </Text>
        </View>

        <View style={[styles.scoreRow, { marginTop: theme.spacing.lg }]}>
          <Card style={styles.scoreCard}>
            <Text variant="caption" color="textMuted">
              {t('home.wellnessScore')}
            </Text>
            <Text variant="display" style={{ color: theme.colors.primary, marginTop: 4 }}>
              {score}
            </Text>
          </Card>
          <Card style={styles.scoreCard}>
            <Text variant="caption" color="textMuted">
              {t('home.streak')}
            </Text>
            <Text variant="display" style={{ marginTop: 4 }}>
              {streak?.currentStreak ?? 0}
            </Text>
            <Text variant="caption" color="textFaint">
              {t('home.dayStreak')}
            </Text>
          </Card>
        </View>

        <Card style={{ marginTop: theme.spacing.md }}>
          <View style={styles.rowBetween}>
            <Text variant="bodyStrong">{t('home.todaysPlan')}</Text>
            {progress ? (
              <Text variant="caption" color="primary">
                {progress.done}/{progress.total}
              </Text>
            ) : null}
          </View>
          {plan ? (
            <>
              <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
                {plan.title}
              </Text>
              <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
                {plan.encouragement}
              </Text>
              <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
                {t('plan.eta').replace('{minutes}', String(plan.estimatedMinutes))}
              </Text>
              <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                <Button
                  label={t('home.continuePlan')}
                  onPress={() => navigation.navigate('Main', { screen: 'Plan' })}
                />
                <Button
                  label={t('home.whyPlan')}
                  variant="ghost"
                  onPress={() => navigation.navigate('Main', { screen: 'Plan' })}
                />
              </View>
            </>
          ) : (
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
              {t('common.loading')}
            </Text>
          )}
        </Card>

        <Card style={{ marginTop: theme.spacing.md }}>
          <Text variant="bodyStrong">{t('home.moodCheckIn')}</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            {latestMood
              ? `${MOOD_BY_KEY[latestMood.mood].label} · ${t('home.moodTrend')}: ${moodTrend ?? '—'}/5`
              : t('home.howAreYou')}
          </Text>
          <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('home.logMood')}
                variant="secondary"
                onPress={() => navigation.navigate('MoodCheckIn')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('mood.history')}
                variant="ghost"
                onPress={() => navigation.navigate('MoodHistory')}
              />
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: theme.spacing.md }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t('home.recentAchievement')}</Text>
              <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
                {progress?.isComplete
                  ? t('home.achievementPlanDone')
                  : streak && streak.currentStreak > 0
                    ? t('home.achievementStreak').replace('{n}', String(streak.currentStreak))
                    : t('home.achievementStart')}
              </Text>
            </View>
            <Icon name="leaf" size={28} color={theme.colors.primary} />
          </View>
        </Card>

        <Card style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <Text variant="bodyStrong">{t('home.nextReminder')}</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            {t('home.reminderHint')}
          </Text>
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
            <Button
              label={t('home.insights')}
              variant="secondary"
              onPress={() => navigation.navigate('Insights')}
            />
            <Button
              label={t('home.talk')}
              variant="ghost"
              onPress={() => navigation.navigate('Main', { screen: 'Chat' })}
            />
          </View>
        </Card>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', gap: 12 },
  scoreCard: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
