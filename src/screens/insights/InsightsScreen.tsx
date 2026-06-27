import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, EmptyState, Loading, MoodBarChart, Screen, SectionHeader, Text } from '@/components';
import { MOOD_TAGS } from '@/constants/moods';
import { breathingRepository, journalRepository, moodRepository } from '@/database';
import { computeWeeklyInsights, type WeeklyInsight } from '@/database/repositories/moodRepository';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Insights'>;

interface Stats {
  insight: WeeklyInsight;
  journalCount: number;
  breathingCount: number;
}

function tagLabel(key: string): string {
  return MOOD_TAGS.find((t) => t.key === key)?.label ?? key;
}

function StatTile({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <Card style={styles.tile}>
      <Text variant="title" color="primary">
        {value}
      </Text>
      <Text variant="caption" color="textMuted" center>
        {label}
      </Text>
    </Card>
  );
}

export function InsightsScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    try {
      const [moods, journalCount, breathingCount] = await Promise.all([
        moodRepository.list(1000),
        journalRepository.count(),
        breathingRepository.count(),
      ]);
      setStats({ insight: computeWeeklyInsights(moods), journalCount, breathingCount });
    } catch (error) {
      logger.error('Insights load failed', { error: String(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!stats) {
    return (
      <Screen title={t('home.insights')} onBack={() => navigation.goBack()}>
        <Loading label={t('common.loading')} />
      </Screen>
    );
  }

  const { insight } = stats;
  const hasData = insight.entryCount > 0;

  return (
    <Screen title={t('home.insights')} onBack={() => navigation.goBack()} scroll>
      <View style={styles.statRow}>
        <StatTile
          value={insight.averageScore != null ? `${insight.averageScore}/5` : '—'}
          label={t('mood.average')}
        />
        <StatTile value={`${insight.entryCount}`} label="Check-ins" />
      </View>
      <View style={[styles.statRow, { marginTop: theme.spacing.md }]}>
        <StatTile value={`${stats.journalCount}`} label="Journal entries" />
        <StatTile value={`${stats.breathingCount}`} label="Calm sessions" />
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <SectionHeader title={t('mood.weekly')} />
        <Card>
          {hasData ? (
            <MoodBarChart data={insight.dailyScores} />
          ) : (
            <EmptyState emoji="📈" title={t('mood.noData')} />
          )}
        </Card>
      </View>

      {insight.topTags.length > 0 ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionHeader title="Most common themes" />
          <Card>
            <View style={{ gap: theme.spacing.sm }}>
              {insight.topTags.map((tag) => (
                <View key={tag.tag} style={styles.tagRow}>
                  <Text variant="body">{tagLabel(tag.tag)}</Text>
                  <Text variant="bodyStrong" color="primary">
                    {tag.count}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, alignItems: 'center', gap: 4 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
