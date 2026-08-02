import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Loading, MoodBarChart, Screen, Text } from '@/components';
import { MOOD_TAGS } from '@/constants/moods';
import { breathingRepository, journalRepository, moodRepository } from '@/database';
import { computeWeeklyInsights, type WeeklyInsight } from '@/database/repositories/moodRepository';
import { wellnessPlanRepository } from '@/database/repositories/wellnessPlanRepository';
import { useSaveCelebration } from '@/hooks/useSaveCelebration';
import { useTranslation } from '@/hooks/useTranslation';
import type { RootStackParamList } from '@/navigation/types';
import { getCareStreak } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { CareHero, FadeInView, Icon, SectionLabel, type OppunaIconName } from '@/ui';
import { logger } from '@/utils/logger';
import { computeWellnessScore } from '@/wellness/planService';

type Props = NativeStackScreenProps<RootStackParamList, 'Insights'>;

interface Stats {
  insight: WeeklyInsight;
  journalCount: number;
  breathingCount: number;
  planCompletionPct: number | null;
  streak: number;
  wellnessScore: number;
}

interface MetricCard {
  label: string;
  value: string;
  icon: OppunaIconName;
  hint: string;
}

function tagLabel(key: string): string {
  return MOOD_TAGS.find((t) => t.key === key)?.label ?? key;
}

function statsSignature(stats: Stats): string {
  return `${stats.insight.entryCount}:${stats.journalCount}:${stats.breathingCount}:${stats.insight.averageScore ?? 'x'}:${stats.planCompletionPct ?? 'x'}:${stats.streak}`;
}

export function InsightsScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const { celebrate, celebration } = useSaveCelebration();
  const [stats, setStats] = useState<Stats | null>(null);
  const lastSignature = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [moods, journalCount, breathingCount, recentPlans, streak] = await Promise.all([
        moodRepository.list(1000),
        journalRepository.count(),
        breathingRepository.count(),
        wellnessPlanRepository.getRecent(7),
        getCareStreak(),
      ]);
      const insight = computeWeeklyInsights(moods);
      let planActs = 0;
      let planDone = 0;
      for (const plan of recentPlans) {
        planActs += plan.activities.length;
        planDone += plan.completedIds.length;
      }
      const today = recentPlans[0] ?? null;
      const planCompletionPct =
        planActs > 0 ? Math.round((planDone / planActs) * 100) : null;
      const next: Stats = {
        insight,
        journalCount,
        breathingCount,
        planCompletionPct,
        streak: streak.currentStreak,
        wellnessScore: computeWellnessScore({
          streak: streak.currentStreak,
          plan: today,
          moodAverage: insight.averageScore,
        }),
      };
      const sig = statsSignature(next);
      const hasData =
        next.insight.entryCount > 0 ||
        next.journalCount > 0 ||
        next.breathingCount > 0 ||
        next.planCompletionPct != null;

      if (hasData && lastSignature.current !== null && lastSignature.current !== sig) {
        void celebrate({
          kind: 'insight',
          message: 'Your insights updated',
          detail: 'A quiet look at how you have been showing up — only on this device.',
        });
      }
      lastSignature.current = sig;
      setStats(next);
    } catch (error) {
      logger.error('Insights load failed', { error: String(error) });
    }
  }, [celebrate]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!stats) {
    return (
      <>
        <Screen title={t('home.insights')} onBack={() => navigation.goBack()}>
          <Loading label={t('common.loading')} />
        </Screen>
        {celebration}
      </>
    );
  }

  const { insight } = stats;
  const hasData =
    insight.entryCount > 0 || stats.journalCount > 0 || stats.breathingCount > 0;

  if (!hasData) {
    return (
      <>
        <Screen title={t('home.insights')} onBack={() => navigation.goBack()}>
          <View style={styles.empty}>
            <CareHero
              leafVariant="outline"
              leafSize={72}
              title={t('mood.noData')}
              body="Check in a few times this week and your patterns will appear here — privately, on your device."
            />
            <View style={{ alignSelf: 'stretch', paddingHorizontal: theme.spacing.lg }}>
              <Button
                label="Check in now"
                onPress={() => navigation.navigate('MoodCheckIn')}
              />
            </View>
          </View>
        </Screen>
        {celebration}
      </>
    );
  }

  const metrics: MetricCard[] = [];
  metrics.push({
    label: t('insights.wellnessScore'),
    value: String(stats.wellnessScore),
    icon: 'leaf',
    hint: 'Private score',
  });
  if (stats.planCompletionPct != null) {
    metrics.push({
      label: t('insights.planCompletion'),
      value: `${stats.planCompletionPct}%`,
      icon: 'plan',
      hint: 'Last 7 plans',
    });
  }
  if (stats.streak > 0) {
    metrics.push({
      label: t('home.streak'),
      value: String(stats.streak),
      icon: 'check',
      hint: 'Days showing up',
    });
  }
  if (insight.entryCount > 0) {
    metrics.push({
      label: 'Check-ins',
      value: String(insight.entryCount),
      icon: 'mood',
      hint: 'This week',
    });
    if (insight.averageScore != null) {
      metrics.push({
        label: 'Avg mood',
        value: `${insight.averageScore}/5`,
        icon: 'insights',
        hint: 'Weekly average',
      });
    }
  }
  if (stats.journalCount > 0) {
    metrics.push({
      label: 'Journal',
      value: String(stats.journalCount),
      icon: 'journal',
      hint: 'Entries saved',
    });
  }
  if (stats.breathingCount > 0) {
    metrics.push({
      label: 'Calm',
      value: String(stats.breathingCount),
      icon: 'breathe',
      hint: 'Breath sessions',
    });
  }

  const maxTagCount = Math.max(1, ...insight.topTags.map((tag) => tag.count));

  return (
    <>
      <Screen title={t('home.insights')} onBack={() => navigation.goBack()} scroll>
        <FadeInView delay={0} preset="fade">
          <CareHero
            leafVariant="celebrate"
            leafSize={64}
            title="Your week, quietly"
            body={t('insights.encouragement')}
          />
        </FadeInView>

        <FadeInView delay={80}>
          <SectionLabel>AT A GLANCE</SectionLabel>
          <View style={[styles.metrics, { gap: theme.spacing.md, marginBottom: theme.spacing.xl }]}>
            {metrics.map((metric, index) => (
              <FadeInView
                key={metric.label}
                delay={100 + index * 40}
                preset="soft"
                style={styles.metricGrow}
              >
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                      paddingVertical: theme.spacing.lg,
                      paddingRight: theme.spacing.lg,
                      paddingLeft: theme.spacing.lg + 8,
                    },
                  ]}
                >
                  <View
                    style={[styles.accentBar, { backgroundColor: theme.colors.primaryMuted }]}
                  />
                  <View
                    style={[
                      styles.metricIcon,
                      { backgroundColor: theme.colors.primaryMuted },
                    ]}
                  >
                    <Icon name={metric.icon} size={18} color={theme.colors.primary} />
                  </View>
                  <Text variant="label" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
                    {metric.label.toUpperCase()}
                  </Text>
                  <Text variant="title" color="primary" style={{ marginTop: 2 }}>
                    {metric.value}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    {metric.hint}
                  </Text>
                </View>
              </FadeInView>
            ))}
          </View>
        </FadeInView>

        {insight.entryCount > 0 ? (
          <FadeInView delay={160}>
            <SectionLabel>{t('mood.weekly').toUpperCase()}</SectionLabel>
            <View
              style={[
                {
                  backgroundColor: theme.colors.primaryMuted,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              <Text
                variant="caption"
                color="textMuted"
                style={{ letterSpacing: 0.6, marginBottom: theme.spacing.md }}
              >
                MOOD OVER THE WEEK
              </Text>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.md,
                }}
              >
                <MoodBarChart data={insight.dailyScores} />
              </View>
            </View>
          </FadeInView>
        ) : null}

        {insight.topTags.length > 0 ? (
          <FadeInView delay={220}>
            <SectionLabel>MOST COMMON THEMES</SectionLabel>
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
              {insight.topTags.map((tag, index) => {
                const ratio = tag.count / maxTagCount;
                return (
                  <FadeInView key={tag.tag} delay={240 + index * 40} preset="soft">
                    <View
                      style={[
                        styles.tagCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.lg,
                          paddingVertical: theme.spacing.lg,
                          paddingRight: theme.spacing.lg,
                          paddingLeft: theme.spacing.lg + 8,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.accentBar,
                          { backgroundColor: theme.colors.primaryMuted },
                        ]}
                      />
                      <View style={styles.tagHeader}>
                        <Text variant="bodyStrong" style={{ flex: 1 }}>
                          {tagLabel(tag.tag)}
                        </Text>
                        <Text variant="bodyStrong" color="primary">
                          {tag.count}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.tagTrack,
                          { backgroundColor: theme.colors.border, marginTop: theme.spacing.sm },
                        ]}
                      >
                        <View
                          style={[
                            styles.tagFill,
                            {
                              width: `${Math.max(0.12, ratio) * 100}%`,
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </View>
          </FadeInView>
        ) : null}

        <FadeInView delay={280}>
          <View
            style={[
              styles.privacyNote,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            <Icon name="shield" size={20} color={theme.colors.primary} />
            <Text
              variant="caption"
              color="textMuted"
              style={{ flex: 1, marginLeft: theme.spacing.md }}
            >
              These insights never leave your phone. Oppuna does not sync or analyze them in the
              cloud.
            </Text>
          </View>
        </FadeInView>
      </Screen>
      {celebration}
    </>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap' },
  metricGrow: { flexGrow: 1, flexBasis: '45%', minWidth: 140 },
  metricCard: {
    overflow: 'hidden',
    minHeight: 120,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  tagCard: {
    overflow: 'hidden',
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tagFill: {
    height: '100%',
    borderRadius: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
