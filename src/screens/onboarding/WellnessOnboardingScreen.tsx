import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Chip, Screen, Text, TextField } from '@/components';
import { APP } from '@/constants/app';
import type { RootStackParamList } from '@/navigation/types';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import {
  FadeInView,
  Icon,
  LivingLeaf,
  PressableScale,
  SectionLabel,
  softSpring,
  type LivingLeafVariant,
} from '@/ui';
import { saveWellnessPrefs } from '@/wellness/planService';
import type { WellnessGoalChip, WellnessMoodChip } from '@/wellness/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WellnessOnboarding'>;

const MOODS: { id: WellnessMoodChip; label: string }[] = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
  { id: 'tired', label: 'Tired' },
  { id: 'lonely', label: 'Lonely' },
  { id: 'stressed', label: 'Stressed' },
  { id: 'calm', label: 'Calm' },
];

const GOALS: { id: WellnessGoalChip; label: string }[] = [
  { id: 'better_sleep', label: 'Better sleep' },
  { id: 'reduce_stress', label: 'Reduce stress' },
  { id: 'daily_routine', label: 'Daily routine' },
  { id: 'anxiety', label: 'Ease anxiety' },
  { id: 'focus', label: 'Focus' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'positive_thinking', label: 'Positive thinking' },
];

const TIME_OPTIONS = [
  { minutes: 10 as const, hint: 'Quick reset' },
  { minutes: 15 as const, hint: 'Balanced' },
  { minutes: 20 as const, hint: 'Steady care' },
  { minutes: 30 as const, hint: 'Deeper focus' },
];

const DEFAULT_MINUTES = 15;
const STEP_COUNT = 4;

type Step = 0 | 1 | 2 | 3;

const STEP_META: {
  eyebrow: string;
  title: string;
  body: string;
  leaf: LivingLeafVariant;
}[] = [
  {
    eyebrow: 'WELCOME',
    title: APP.name,
    body: 'A private daily wellness plan — offline, gentle, and shaped around you.',
    leaf: 'greet',
  },
  {
    eyebrow: 'OPTIONAL',
    title: 'How are you feeling?',
    body: 'Pick what fits, or skip. We’ll still make a soft plan for today.',
    leaf: 'idle',
  },
  {
    eyebrow: 'OPTIONAL',
    title: 'What matters right now?',
    body: 'Goals help personalize activities. Skip for a balanced mix.',
    leaf: 'thinking',
  },
  {
    eyebrow: 'OPTIONAL',
    title: 'How much time today?',
    body: `Defaults to ${DEFAULT_MINUTES} minutes if you skip.`,
    leaf: 'outline',
  },
];

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ProgressBar({ step }: { step: Step }): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue((step + 1) / STEP_COUNT);

  useEffect(() => {
    const next = (step + 1) / STEP_COUNT;
    progress.value = reduceMotion ? next : withSpring(next, softSpring);
  }, [step, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0.08, progress.value) * 100}%`,
  }));

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressMeta}>
        <Text variant="caption" color="textFaint">
          Step {step + 1} of {STEP_COUNT}
        </Text>
        <Text variant="caption" color="textMuted">
          {STEP_META[step]?.eyebrow ?? ''}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: theme.colors.primary },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}

function TimeTile({
  minutes,
  hint,
  selected,
  onPress,
}: {
  minutes: number;
  hint: string;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  const theme = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${minutes} minutes, ${hint}`}
      style={[
        styles.timeTile,
        {
          backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Text
        variant="title"
        style={{ color: selected ? theme.colors.primary : theme.colors.text }}
      >
        {minutes}
      </Text>
      <Text variant="caption" color={selected ? 'primary' : 'textMuted'}>
        min
      </Text>
      <Text
        variant="caption"
        color="textFaint"
        style={{ marginTop: theme.spacing.xs }}
      >
        {hint}
      </Text>
    </PressableScale>
  );
}

export function WellnessOnboardingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [moods, setMoods] = useState<WellnessMoodChip[]>([]);
  const [goals, setGoals] = useState<WellnessGoalChip[]>([]);
  const [minutes, setMinutes] = useState<(typeof TIME_OPTIONS)[number]['minutes']>(DEFAULT_MINUTES);
  const [saving, setSaving] = useState(false);

  const meta = STEP_META[step]!;

  const finishToPrivacy = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      const displayName = name.trim();
      setDisplayName(displayName);
      await saveWellnessPrefs({
        displayName,
        moods,
        goals,
        availableMinutes: minutes,
      });
      navigation.navigate('Privacy');
    } finally {
      setSaving(false);
    }
  };

  const goNext = (): void => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    void finishToPrivacy();
  };

  const skipStep = (): void => {
    if (step === 1) setMoods([]);
    if (step === 2) setGoals([]);
    if (step === 3) setMinutes(DEFAULT_MINUTES);
    goNext();
  };

  return (
    <Screen scroll contentStyle={styles.screenContent}>
      <View
        pointerEvents="none"
        style={[
          styles.atmosphere,
          { backgroundColor: theme.colors.primaryMuted, opacity: theme.mode === 'dark' ? 0.25 : 0.45 },
        ]}
      />

      <ProgressBar step={step} />

      <FadeInView key={step} delay={16} preset="soft" style={styles.stepBody}>
        <View style={styles.hero}>
          <View
            style={[
              styles.leafOrb,
              { backgroundColor: theme.colors.primaryMuted },
            ]}
          >
            <LivingLeaf size={step === 0 ? 72 : 56} variant={meta.leaf} showAura={false} />
          </View>

          {step === 0 ? (
            <>
              <Text
                variant="display"
                center
                style={{ marginTop: theme.spacing.lg, letterSpacing: -0.5 }}
              >
                {meta.title}
              </Text>
              <Text
                variant="body"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.md, maxWidth: 300, lineHeight: 22 }}
              >
                {meta.body}
              </Text>
            </>
          ) : (
            <>
              <SectionLabel style={{ marginTop: theme.spacing.lg, marginBottom: 0 }}>
                {meta.eyebrow}
              </SectionLabel>
              <Text variant="title" center style={{ marginTop: theme.spacing.sm }}>
                {meta.title}
              </Text>
              <Text
                variant="body"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}
              >
                {meta.body}
              </Text>
            </>
          )}
        </View>

        {step === 0 ? (
          <View
            style={[
              styles.namePanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            <TextField
              label="First name (optional)"
              value={name}
              onChangeText={setName}
              placeholder="What should we call you?"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
              You can skip every step after this — a plan still waits for you.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={[styles.chips, { marginTop: theme.spacing.xl }]}>
            {MOODS.map((mood) => (
              <Chip
                key={mood.id}
                label={mood.label}
                selected={moods.includes(mood.id)}
                onPress={() => setMoods((prev) => toggleInList(prev, mood.id))}
              />
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={[styles.chips, { marginTop: theme.spacing.xl }]}>
            {GOALS.map((goal) => (
              <Chip
                key={goal.id}
                label={goal.label}
                selected={goals.includes(goal.id)}
                onPress={() => setGoals((prev) => toggleInList(prev, goal.id))}
              />
            ))}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={[styles.timeGrid, { marginTop: theme.spacing.xl }]}>
            {TIME_OPTIONS.map((option) => (
              <TimeTile
                key={option.minutes}
                minutes={option.minutes}
                hint={option.hint}
                selected={minutes === option.minutes}
                onPress={() => setMinutes(option.minutes)}
              />
            ))}
          </View>
        ) : null}
      </FadeInView>

      <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>
        <Button
          label={step === 0 ? 'Get started' : step === 3 ? 'Continue' : 'Next'}
          onPress={goNext}
          disabled={saving}
          loading={saving}
        />

        <View style={styles.footerRow}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => (s - 1) as Step)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.footerLink}
            >
              <Icon name="back" size={18} color={theme.colors.textMuted} />
              <Text variant="bodyStrong" color="textMuted">
                Back
              </Text>
            </Pressable>
          ) : (
            <View style={styles.footerLink} />
          )}

          <Pressable
            onPress={() => {
              if (step === 0) {
                void finishToPrivacy();
                return;
              }
              skipStep();
            }}
            disabled={saving}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? 'Skip setup' : 'Skip'}
            style={styles.footerLink}
          >
            <Text variant="bodyStrong" color="primary">
              {step === 0 ? 'Skip setup' : 'Skip'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  atmosphere: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  progressBlock: {
    marginBottom: 8,
    gap: 8,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  stepBody: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    marginTop: 12,
  },
  leafOrb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePanel: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeTile: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  footer: {
    gap: 14,
    marginTop: 'auto',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 4,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
});
