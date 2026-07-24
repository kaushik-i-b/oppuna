import React, { useCallback, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Screen, Text } from '@/components';
import { APP } from '@/constants/app';
import { MOOD_BY_KEY } from '@/constants/moods';
import { moodRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n';
import {
  completeDailyCareTask,
  getCareStreak,
  getDailyCareProgress,
  getGardenProgress,
  getWeeklyProgress,
  type CareStreakState,
  type DailyCareTask,
  type GardenProgress,
  type WeeklyProgress,
} from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, Icon, LivingLeaf, PressableScale, type OppunaIconName } from '@/ui';
import { relativeDay } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { MoodEntry } from '@/types';

function greetingKey(now = new Date()): TranslationKey {
  const hour = now.getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function navigateDailyAction(
  navigation: ReturnType<typeof useAppNavigation>,
  action: DailyCareTask['action'],
): void {
  switch (action) {
    case 'mood':
      navigation.navigate('Main', { screen: 'Mood' });
      break;
    case 'breathe':
      navigation.navigate('Breathing');
      break;
    case 'journal':
      navigation.navigate('Main', { screen: 'Journal' });
      break;
    case 'ground':
      navigation.navigate('Grounding');
      break;
    case 'sleep':
      navigation.navigate('Sleep');
      break;
    case 'chat':
      navigation.navigate('Main', { screen: 'Chat' });
      break;
    case 'selfcare':
      navigation.navigate('SelfCare');
      break;
  }
}

export function HomeScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const haptics = useHaptics();
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [streak, setStreak] = useState<CareStreakState | null>(null);
  const [tasks, setTasks] = useState<DailyCareTask[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [garden, setGarden] = useState<GardenProgress | null>(null);
  const [week, setWeek] = useState<WeeklyProgress | null>(null);
  const [greeting, setGreeting] = useState<TranslationKey>(() => greetingKey());

  const refreshGreeting = useCallback(() => {
    setGreeting(greetingKey());
  }, []);

  const refresh = useCallback(() => {
    let active = true;
    refreshGreeting();
    (async () => {
      try {
        const [moodEntries, streakState, daily, gardenState, weekState] = await Promise.all([
          moodRepository.list(1),
          getCareStreak(),
          getDailyCareProgress(),
          getGardenProgress(),
          getWeeklyProgress(),
        ]);
        if (!active) return;
        setLatestMood(moodEntries[0] ?? null);
        setStreak(streakState);
        setTasks(daily.tasks);
        setCompletedIds(daily.completedIds);
        setGarden(gardenState);
        setWeek(weekState);
      } catch (error) {
        logger.warn('Home load failed', { error: String(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshGreeting]);

  useFocusEffect(refresh);

  // Update greeting when returning from background across morning/afternoon/evening.
  useFocusEffect(
    useCallback(() => {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refreshGreeting();
      });
      return () => sub.remove();
    }, [refreshGreeting]),
  );

  const nextTask = tasks.find((task) => !completedIds.includes(task.id));
  const completedCount = completedIds.length;

  const onContinue = async (): Promise<void> => {
    if (!nextTask) {
      navigation.navigate('Main', { screen: 'Chat' });
      return;
    }
    void haptics.selection();
    try {
      const next = await completeDailyCareTask(nextTask.id);
      setCompletedIds(next);
      setStreak(await getCareStreak());
      setGarden(await getGardenProgress());
      setWeek(await getWeeklyProgress());
    } catch (error) {
      logger.warn('Daily care complete failed', { error: String(error) });
    }
    navigateDailyAction(navigation, nextTask.action);
  };

  const compactLinks: { icon: OppunaIconName; label: string; onPress: () => void }[] = [
    {
      icon: 'journal',
      label: t('tabs.journal'),
      onPress: () => navigation.navigate('Main', { screen: 'Journal' }),
    },
    { icon: 'sleep', label: t('home.sleep'), onPress: () => navigation.navigate('Sleep') },
    { icon: 'insights', label: t('home.insights'), onPress: () => navigation.navigate('Insights') },
    { icon: 'selfcare', label: t('home.selfCare'), onPress: () => navigation.navigate('SelfCare') },
  ];

  return (
    <Screen scroll>
      <FadeInView key="home-greeting" delay={0} preset="fade">
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="caption" color="textMuted" style={{ letterSpacing: 0.6 }}>
            {APP.name.toUpperCase()}
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {t(greeting)}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
            {t('home.howAreYou')}
          </Text>
        </View>
      </FadeInView>

      <FadeInView key="home-mood" delay={60}>
        <PressableScale
          onPress={() => navigation.navigate('Main', { screen: 'Mood' })}
          accessibilityRole="button"
          accessibilityLabel={t('home.logMood')}
          style={[
            styles.moodQuick,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {latestMood ? MOOD_BY_KEY[latestMood.mood].label : 'How are you feeling today?'}
            </Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
              {latestMood
                ? `Last check-in · ${relativeDay(latestMood.createdAt)}`
                : 'A 20-second check-in'}
            </Text>
          </View>
          <Icon name="mood" size={24} color={theme.colors.primary} />
        </PressableScale>
      </FadeInView>

      {streak ? (
        <FadeInView key="home-streak" delay={120}>
          <View
            style={[
              styles.streakRow,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
                gap: theme.spacing.md,
              },
            ]}
          >
            <LivingLeaf
              size={56}
              variant={streak.showedUpToday ? 'celebrate' : 'idle'}
              showAura
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: theme.colors.primary }}>
                {streak.currentStreak > 0
                  ? `${streak.currentStreak}-day Care Streak`
                  : 'Start your Care Streak'}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {streak.showedUpToday
                  ? 'You showed up for yourself today.'
                  : streak.restDayAvailable
                    ? 'One Rest Day keeps your streak safe if life gets busy.'
                    : 'One small care action is enough.'}
              </Text>
            </View>
          </View>
        </FadeInView>
      ) : null}

      <FadeInView key="home-care" delay={180}>
        <Text
          variant="label"
          color="textFaint"
          style={{ letterSpacing: 1.2, marginBottom: theme.spacing.sm }}
        >
          TODAY&apos;S CARE
        </Text>
        <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.lg }}>
          {tasks.map((task, index) => {
            const done = completedIds.includes(task.id);
            const current = nextTask?.id === task.id;
            return (
              <View
                key={task.id}
                style={[
                  styles.taskRow,
                  index < tasks.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                    marginBottom: theme.spacing.md,
                    paddingBottom: theme.spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.check,
                    {
                      borderColor: done ? theme.colors.primary : theme.colors.border,
                      backgroundColor: done ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {done ? <Icon name="check" size={14} color={theme.colors.onPrimary} /> : null}
                  {!done && current ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyStrong"
                    style={{ opacity: done ? 0.55 : 1, textDecorationLine: done ? 'line-through' : 'none' }}
                  >
                    {task.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {task.subtitle} · {task.minutes} min
                  </Text>
                </View>
              </View>
            );
          })}
          <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.md }}>
            {completedCount} of {tasks.length} complete
          </Text>
          <Button
            label={nextTask ? 'Continue' : 'Talk with Oppuna'}
            onPress={() => void onContinue()}
          />
        </Card>
      </FadeInView>

      <FadeInView key="home-hero" delay={240}>
        <PressableScale
          onPress={() => navigation.navigate('Main', { screen: 'Chat' })}
          accessibilityRole="button"
          accessibilityLabel={t('home.talk')}
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.xl,
              ...theme.shadow,
            },
          ]}
        >
          <LivingLeaf size={48} variant="greet" />
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text variant="subtitle">Talk with Oppuna</Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              Something on your mind?
            </Text>
          </View>
          <Icon name="chevron" size={20} color={theme.colors.textFaint} />
        </PressableScale>
      </FadeInView>

      <FadeInView key="home-now" delay={300}>
        <Text
          variant="label"
          color="textFaint"
          style={{ letterSpacing: 1.2, marginBottom: theme.spacing.sm }}
        >
          FOR RIGHT NOW
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          {(
            [
              { icon: 'breathe' as const, label: 'Breathe', route: 'Breathing' as const },
              { icon: 'ground' as const, label: 'Ground yourself', route: 'Grounding' as const },
            ] as const
          ).map((item) => (
            <PressableScale
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={[
                styles.nowCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Icon name={item.icon} size={22} color={theme.colors.primary} />
              <Text variant="bodyStrong" style={{ marginTop: theme.spacing.sm }}>
                {item.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </FadeInView>

      {week ? (
        <FadeInView key="home-week" delay={340}>
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text
              variant="label"
              color="textFaint"
              style={{ letterSpacing: 1.2, marginBottom: theme.spacing.sm }}
            >
              YOUR WEEK
            </Text>
            <View style={styles.weekRow}>
              {week.days.map((day) => (
                <View key={day.date} style={styles.weekDay}>
                  <Text variant="label" color="textFaint">
                    {day.label}
                  </Text>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginTop: 6,
                      backgroundColor: day.active ? theme.colors.primary : theme.colors.border,
                    }}
                  />
                </View>
              ))}
            </View>
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
              {week.activeCount} days you showed up
              {week.moodCount || week.journalCount || week.calmCount
                ? ` · ${week.moodCount} check-ins · ${week.journalCount} journal · ${week.calmCount} calm`
                : ''}
            </Text>
          </View>
        </FadeInView>
      ) : null}

      {garden && garden.careActions > 0 ? (
        <FadeInView key="home-garden" delay={380}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.xl,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surfaceAlt,
            }}
          >
            <LivingLeaf size={36} variant={garden.stage === 'garden' ? 'celebrate' : 'idle'} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Oppuna Garden</Text>
              <Text variant="caption" color="textMuted">
                {garden.stage === 'sprout' && 'A sprout has begun.'}
                {garden.stage === 'leaves' && 'More leaves are opening.'}
                {garden.stage === 'flower' && 'Something is beginning to flower.'}
                {garden.stage === 'garden' && 'Your garden is growing quietly.'}
                {garden.stage === 'seed' && 'Waiting for your first care action.'}
              </Text>
            </View>
          </View>
        </FadeInView>
      ) : null}

      <FadeInView key="home-links" delay={420} preset="lift">
        <View style={{ gap: 4 }}>
          {compactLinks.map((link) => (
            <PressableScale
              key={link.label}
              onPress={link.onPress}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              scaleTo={0.99}
              style={[
                styles.linkRow,
                {
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <Icon name={link.icon} size={20} color={theme.colors.textMuted} />
              <Text variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
                {link.label}
              </Text>
              <Icon name="chevron" size={18} color={theme.colors.textFaint} />
            </PressableScale>
          ))}
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  moodQuick: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', overflow: 'visible' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  nowCard: {
    flex: 1,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
