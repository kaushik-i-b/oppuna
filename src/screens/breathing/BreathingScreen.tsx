import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BreathingCircle, Button, Card, Screen, SectionHeader, Text } from '@/components';
import type { BreathPhase } from '@/components/domain/BreathingCircle';
import { breathingRepository } from '@/database';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { BreathingPattern } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Breathing'>;

interface Step {
  phase: Exclude<BreathPhase, 'idle'>;
  seconds: number;
}

interface PatternConfig {
  key: BreathingPattern;
  title: string;
  description: string;
  steps: Step[];
  cycles: number;
}

const PATTERNS: PatternConfig[] = [
  {
    key: 'four_four_six',
    title: '4-4-6 breathing',
    description: 'In for 4, hold for 4, out for 6. Calms the nervous system.',
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
    description: 'In 4, hold 4, out 4, hold 4. Steady and grounding.',
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
    description: 'A longer 4-4-6 session to fully settle.',
    steps: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 6 },
    ],
    cycles: 21,
  },
];

const PHASE_LABEL: Record<Exclude<BreathPhase, 'idle'>, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
};

type Stage = 'select' | 'running' | 'complete';

export function BreathingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const { selection, notify } = useHaptics();

  const [stage, setStage] = useState<Stage>('select');
  const [config, setConfig] = useState<PatternConfig | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startedAtRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      } catch (error) {
        logger.warn('Save breathing session failed', { error: String(error) });
      }
    },
    [clearTimers, config, cycle],
  );

  // Schedule each phase whenever the phase/cycle changes while running.
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
      startedAtRef.current = Date.now();
      setStage('running');
    },
    [selection],
  );

  const reset = useCallback(() => {
    clearTimers();
    setStage('select');
    setConfig(null);
  }, [clearTimers]);

  if (stage === 'running' && config) {
    const step = config.steps[phaseIndex];
    return (
      <Screen title={config.title} onBack={() => void finish(false)}>
        <View style={styles.center}>
          <BreathingCircle
            phase={step?.phase ?? 'idle'}
            durationMs={(step?.seconds ?? 1) * 1000}
            label={step ? PHASE_LABEL[step.phase] : ''}
            caption={`${secondsLeft}s`}
          />
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xl }}>
            Cycle {Math.min(cycle + 1, config.cycles)} of {config.cycles}
          </Text>
        </View>
        <Button label={t('breathing.stop')} variant="secondary" onPress={() => void finish(false)} />
      </Screen>
    );
  }

  if (stage === 'complete') {
    return (
      <Screen title={t('breathing.complete')}>
        <View style={styles.center}>
          <Text variant="display">🌿</Text>
          <Text variant="title" center style={{ marginTop: theme.spacing.md }}>
            {t('breathing.complete')}
          </Text>
          <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.sm }}>
            {t('breathing.completeBody')}
          </Text>
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
      <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.lg }}>
        Choose a rhythm. Follow the circle as it grows and shrinks.
      </Text>
      <SectionHeader title="Patterns" />
      <View style={{ gap: theme.spacing.md }}>
        {PATTERNS.map((pattern) => (
          <Card key={pattern.key} onPress={() => start(pattern)} accessibilityLabel={pattern.title}>
            <Text variant="subtitle">{pattern.title}</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              {pattern.description}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
});
