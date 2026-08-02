import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Screen, Text } from '@/components';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, Icon } from '@/ui';
import { logger } from '@/utils/logger';
import {
  completePlan,
  generateTodayPlan,
  getTodayPlan,
  planProgress,
  togglePlanActivity,
} from '@/wellness/planService';
import type { WellnessDeepLink, WellnessPlan } from '@/wellness/types';

function openDeepLink(
  navigation: ReturnType<typeof useAppNavigation>,
  link: WellnessDeepLink,
): void {
  switch (link) {
    case 'breathe':
      navigation.navigate('Breathing');
      break;
    case 'ground':
      navigation.navigate('Grounding');
      break;
    case 'sleep':
      navigation.navigate('Sleep');
      break;
    case 'journal':
      navigation.navigate('JournalEditor', { kind: 'daily' });
      break;
    case 'mood':
      navigation.navigate('MoodCheckIn');
      break;
    default:
      break;
  }
}

export function PlanScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const haptics = useHaptics();
  const [plan, setPlan] = useState<WellnessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhy, setShowWhy] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    let active = true;
    (async () => {
      try {
        let today = await getTodayPlan();
        if (!today) {
          today = await generateTodayPlan({ personalize: true });
        }
        if (active) setPlan(today);
      } catch (error) {
        logger.error('Plan load failed', { error: String(error) });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      return refresh();
    }, [refresh]),
  );

  const progress = plan ? planProgress(plan) : { done: 0, total: 0, ratio: 0, isComplete: false };

  const handleToggle = async (activityId: string): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      haptics.selection();
      const updated = await togglePlanActivity(activityId);
      if (updated) setPlan(updated);
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (): Promise<void> => {
    if (busy || !plan) return;
    setBusy(true);
    try {
      haptics.notify();
      const updated = await completePlan();
      if (updated) setPlan(updated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('plan.title')} scroll>
      {loading || !plan ? (
        <Text variant="body" color="textMuted">
          {t('common.loading')}
        </Text>
      ) : (
        <FadeInView delay={40} preset="soft">
          <Card>
            <Text variant="title">{plan.title}</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
              {plan.encouragement}
            </Text>
            <View style={[styles.metaRow, { marginTop: theme.spacing.md }]}>
              <Text variant="caption" color="textMuted">
                {t('plan.eta').replace('{minutes}', String(plan.estimatedMinutes))}
              </Text>
              <Text variant="caption" color="primary">
                {t('plan.progress')
                  .replace('{done}', String(progress.done))
                  .replace('{total}', String(progress.total))}
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.colors.border, marginTop: theme.spacing.sm },
              ]}
            >
              <View
                style={{
                  width: `${Math.round(progress.ratio * 100)}%`,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
          </Card>

          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            {plan.activities.map((activity) => {
              const done = plan.completedIds.includes(activity.id);
              return (
                <Pressable
                  key={activity.id}
                  onPress={() => void handleToggle(activity.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  style={[
                    styles.activityRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: done ? theme.colors.primary : theme.colors.border,
                        backgroundColor: done ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {done ? <Icon name="check" size={14} color={theme.colors.onPrimary ?? '#fff'} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      variant="bodyStrong"
                      style={done ? { textDecorationLine: 'line-through', opacity: 0.7 } : undefined}
                    >
                      {activity.title}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {activity.description}
                    </Text>
                    <Text variant="caption" color="textFaint">
                      {activity.duration} min
                    </Text>
                  </View>
                  {activity.deepLink !== 'none' ? (
                    <Pressable
                      onPress={() => openDeepLink(navigation, activity.deepLink)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('plan.openTool')}
                    >
                      <Icon name="chevron" size={18} color={theme.colors.primary} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            {!progress.isComplete ? (
              <Button label={t('plan.completeAll')} onPress={() => void handleComplete()} />
            ) : (
              <Text variant="bodyStrong" color="primary" center>
                {t('plan.allDone')}
              </Text>
            )}
            <Button
              label={showWhy ? t('plan.hideWhy') : t('plan.why')}
              variant="ghost"
              onPress={() => setShowWhy((v) => !v)}
            />
            {showWhy ? (
              <Card>
                <Text variant="body" color="textMuted">
                  {plan.explanation}
                </Text>
              </Card>
            ) : null}
          </View>
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: StyleSheet.hairlineWidth },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
