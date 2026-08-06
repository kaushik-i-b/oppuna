import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BreathingCircle, Button, Screen, Text } from '@/components';
import type { BreathPhase } from '@/components/domain/BreathingCircle';
import { breathingRepository } from '@/database';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/hooks/useTranslation';
import type { RootStackParamList } from '@/navigation/types';
import { trackEvent } from '@/services/analyticsService';
import { recordCareActivity } from '@/services/careRetentionService';
import { maybeRequestReview } from '@/services/reviewPromptService';
import { useTheme } from '@/theme/ThemeProvider';
import type { BreathingPattern } from '@/types';
import { CareHero, FadeInView, LivingLeaf, PressableScale, SectionLabel } from '@/ui';
import { logger } from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Breathing'>;

interface Step {
  phase: Exclude<BreathPhase, 'idle'>;
  seconds: number;
}

interface PatternConfig {
  key: BreathingPattern;
  title: string;
  description: string;
  /** Short rhythm chips shown on the card, e.g. ["4", "4", "6"]. */
  rhythm: string[];
  steps: Step[];
  cycles: number;
}

const PATTERNS: PatternConfig[] = [
  {
    key: 'four_four_six',
    title: '4-4-6 breathing',
    description: 'In for 4, hold for 4, out for 6. Softens a busy mind.',
    rhythm: ['4', '4', '6'],
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 6 },
    ],
    cycles: 6,
  },
  {
    key: 'box',
    title: 'Box breathing',
    description: 'Equal sides — in, hold, out, hold. Steady and grounding.',
    rhythm: ['4', '4', '4', '4'],
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
    ],
    cycles: 6,
  },
  {
    key: 'calm_five',
    title: '5-minute calm',
    description: 'A longer 4-4-6 session when you want to fully settle.',
    rhythm: ['4', '4', '6'],
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 6 },
    ],
    cycles: 21,
  },
];

type Stage = 'select' | 'running' | 'complete';

function estimateMinutes(pattern: PatternConfig): number {
  const cycleSec = pattern.steps.reduce((sum, step) => sum + step.seconds, 0);
  return Math.max(1, Math.round((cycleSec * pattern.cycles) / 60));
}

function CycleProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}): React.ReactElement {
  const theme = useTheme();
  const progress = Math.min(1, Math.max(0, current / total));

  return (
    <View style={styles.progressWrap} accessibilityRole="progressbar">
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      </View>
      <Text variant="caption" color="textMuted" style={{ marginTop: 8 }}>
        Cycle {Math.min(current, total)} of {total}
      </Text>
    </View>
  );
}

function PhasePips({
  steps,
  activeIndex,
}: {
  steps: Step[];
  activeIndex: number;
}): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.pips} accessibilityElementsHidden>
      {steps.map((step, index) => {
        const active = index === activeIndex;
        const done = index < activeIndex;
        return (
          <View
            key={`${step.phase}-${index}`}
            style={[
              styles.pip,
              {
                backgroundColor:
                  active || done ? theme.colors.primary : theme.colors.border,
                opacity: active ? 1 : done ? 0.55 : 0.4,
                transform: [{ scale: active ? 1.15 : 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function BreathingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const { selection, notify } = useHaptics();

  const [stage, setStage] = useState<Stage>('select');
  const [config, setConfig] = useState<PatternConfig | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedFully, setCompletedFully] = useState(false);

  const startedAtRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseLabel = useMemo(
    () =>
      ({
        inhale: t('breathing.inhale'),
        hold: t('breathing.hold'),
        exhale: t('breathing.exhale'),
      }) as const,
    [t],
  );

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const finish = useCallback(
    async (completed: boolean) => {
      clearTimers();
      const cfg = config;
      setCompletedFully(completed);
      setStage('complete');
      if (!cfg) return;
      const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      try {
        await breathingRepository.create({
          pattern: cfg.key,
          cycles: completed ? cfg.cycles : cycle,
          durationSec,
          completed,
        });
        if (completed) {
          void recordCareActivity('breathing');
          void maybeRequestReview('breathing_completed');
        }
      } catch (error) {
        logger.warn('Save breathing session failed', { error: String(error) });
      }
    },
    [clearTimers, config, cycle],
  );

  useEffect(() => {
    if (stage !== 'running' || !config) return;
    const step = config.steps[phaseIndex];
    if (!step) return;

    notify();
    setSecondsLeft(step.seconds);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const isLastStep = phaseIndex === config.steps.length - 1;
      if (isLastStep) {
        const nextCycle = cycle + 1;
        if (nextCycle >= config.cycles) {
          void finish(true);
          return;
        }
        setCycle(nextCycle);
        setPhaseIndex(0);
      } else {
        setPhaseIndex(phaseIndex + 1);
      }
    }, step.seconds * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage, config, phaseIndex, cycle, finish, notify]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const start = useCallback(
    (cfg: PatternConfig) => {
      selection();
      setConfig(cfg);
      setCycle(0);
      setPhaseIndex(0);
      setCompletedFully(false);
      startedAtRef.current = Date.now();
      setStage('running');
      void trackEvent('breathing_started', { pattern: cfg.key });
    },
    [selection],
  );

  const reset = useCallback(() => {
    clearTimers();
    setStage('select');
    setConfig(null);
    setCompletedFully(false);
  }, [clearTimers]);

  if (stage === 'running' && config) {
    const step = config.steps[phaseIndex];
    return (
      <Screen title={config.title} onBack={() => void finish(false)}>
        <View
          style={[
            styles.stageShell,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderRadius: theme.radius.xl,
              marginBottom: theme.spacing.lg,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          <LivingLeaf size={40} variant="breathe" showAura={false} />
          <Text
            variant="caption"
            color="textMuted"
            center
            style={{ marginTop: theme.spacing.sm, letterSpacing: 0.6 }}
          >
            FOLLOW THE ORB
          </Text>

          <View style={{ marginTop: theme.spacing.lg }}>
            <BreathingCircle
              phase={step?.phase ?? 'idle'}
              durationMs={(step?.seconds ?? 1) * 1000}
              label={step ? phaseLabel[step.phase] : ''}
              caption={step ? `${secondsLeft}` : undefined}
            />
          </View>

          <PhasePips steps={config.steps} activeIndex={phaseIndex} />
          <CycleProgress current={cycle + 1} total={config.cycles} />
        </View>
        <Button label={t('breathing.stop')} variant="secondary" onPress={() => void finish(false)} />
      </Screen>
    );
  }

  if (stage === 'complete') {
    return (
      <Screen title={t('breathing.complete')}>
        <View style={styles.center}>
          <LivingLeaf size={88} variant="celebrate" />
          <Text variant="title" center style={{ marginTop: theme.spacing.lg }}>
            {completedFully ? t('breathing.complete') : 'Paused'}
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            center
            style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}
          >
            {completedFully
              ? t('breathing.completeBody')
              : 'That’s okay — even a short pause counts. Come back whenever you like.'}
          </Text>
          {config ? (
            <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.md }}>
              {config.title}
            </Text>
          ) : null}
        </View>
        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Breathe again" onPress={reset} />
          <Button label={t('common.done')} variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t('breathing.title')} onBack={() => navigation.goBack()} scroll>
      <FadeInView delay={0} preset="fade">
        <CareHero
          leafVariant="breathe"
          leafSize={68}
          title="Find a rhythm"
          body="Pick a pattern, then follow the soft orb as it grows and shrinks with your breath."
        />
      </FadeInView>

      <FadeInView delay={80}>
        <SectionLabel>PATTERNS</SectionLabel>
        <View style={{ gap: theme.spacing.md }}>
          {PATTERNS.map((pattern, index) => {
            const minutes = estimateMinutes(pattern);
            return (
              <FadeInView key={pattern.key} delay={100 + index * 60} preset="soft">
                <PressableScale
                  onPress={() => start(pattern)}
                  accessibilityRole="button"
                  accessibilityLabel={`${pattern.title}. About ${minutes} minutes.`}
                  style={[
                    styles.patternCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.lg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.accentBar,
                      { backgroundColor: theme.colors.primaryMuted },
                    ]}
                  />
                  <View style={styles.patternHeader}>
                    <Text variant="subtitle" style={{ flex: 1 }}>
                      {pattern.title}
                    </Text>
                    <Text variant="caption" color="textFaint">
                      ~{minutes} min
                    </Text>
                  </View>
                  <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
                    {pattern.description}
                  </Text>
                  <View style={styles.rhythmRow}>
                    {pattern.rhythm.map((beat, beatIndex) => (
                      <View key={`${pattern.key}-beat-${beatIndex}`} style={styles.rhythmItem}>
                        {beatIndex > 0 ? (
                          <Text variant="caption" color="textFaint" style={styles.rhythmDot}>
                            ·
                          </Text>
                        ) : null}
                        <View
                          style={[
                            styles.rhythmChip,
                            { backgroundColor: theme.colors.primaryMuted },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={{ color: theme.colors.primary, fontWeight: '600' }}
                          >
                            {beat}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </PressableScale>
              </FadeInView>
            );
          })}
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stageShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  patternCard: {
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingLeft: 8,
  },
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 8,
  },
  rhythmItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rhythmDot: {
    marginHorizontal: 4,
  },
  rhythmChip: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    marginTop: 20,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
