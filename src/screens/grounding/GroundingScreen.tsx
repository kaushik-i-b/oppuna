import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { useHaptics } from '@/hooks/useHaptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { RootStackParamList } from '@/navigation/types';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import {
  CareHero,
  enter,
  exit,
  FadeInView,
  Icon,
  LivingLeaf,
  PressableScale,
  SectionLabel,
  type OppunaIconName,
} from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Grounding'>;

interface GroundStep {
  count: number;
  sense: OppunaIconName;
  senseLabel: string;
  prompt: string;
}

const STEPS: GroundStep[] = [
  {
    count: 5,
    sense: 'see',
    senseLabel: 'See',
    prompt: 'Look around and name five things you can see.',
  },
  {
    count: 4,
    sense: 'feel',
    senseLabel: 'Feel',
    prompt: 'Notice four things you can physically feel.',
  },
  {
    count: 3,
    sense: 'hear',
    senseLabel: 'Hear',
    prompt: 'Listen for three things you can hear.',
  },
  {
    count: 2,
    sense: 'smell',
    senseLabel: 'Smell',
    prompt: 'Notice two things you can smell.',
  },
  {
    count: 1,
    sense: 'taste',
    senseLabel: 'Taste',
    prompt: 'Notice one thing you can taste.',
  },
];

function StepProgress({ current, total }: { current: number; total: number }): React.ReactElement {
  const theme = useTheme();
  const progress = Math.min(1, Math.max(0, (current + 1) / total));

  return (
    <View style={styles.progressWrap} accessibilityRole="progressbar">
      <View style={styles.pips}>
        {Array.from({ length: total }, (_, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <View
              key={i}
              style={[
                styles.pip,
                {
                  backgroundColor: active || done ? theme.colors.primary : theme.colors.border,
                  opacity: active ? 1 : done ? 0.55 : 0.4,
                  transform: [{ scale: active ? 1.15 : 1 }],
                },
              ]}
            />
          );
        })}
      </View>
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
        Step {Math.min(current + 1, total)} of {total}
      </Text>
    </View>
  );
}

export function GroundingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(-1);
  const [recorded, setRecorded] = useState(false);

  const started = index >= 0;
  const finished = index >= STEPS.length;
  const step = started && !finished ? STEPS[index] : null;

  const completeSession = useCallback(() => {
    if (recorded) return;
    setRecorded(true);
    void recordCareActivity('grounding');
  }, [recorded]);

  const next = (): void => {
    selection();
    const nextIndex = index + 1;
    if (nextIndex >= STEPS.length) {
      completeSession();
    }
    setIndex(nextIndex);
  };

  const contentKey = !started ? 'intro' : finished ? 'done' : `step-${index}`;

  return (
    <Screen title="Grounding" onBack={() => navigation.goBack()} scroll={!started}>
      <View style={styles.center}>
        <Animated.View
          key={contentKey}
          entering={reduceMotion ? undefined : enter.rise()}
          exiting={reduceMotion ? undefined : exit.fade()}
          style={styles.center}
        >
          {!started ? (
            <View style={{ width: '100%' }}>
              <FadeInView delay={0} preset="fade">
                <CareHero
                  leafVariant="ground"
                  leafSize={68}
                  title="5-4-3-2-1"
                  body="Come back to the present through your senses. Move slowly — there is no rush."
                />
              </FadeInView>

              <FadeInView delay={80}>
                <SectionLabel>SENSES</SectionLabel>
                <View style={{ gap: theme.spacing.sm }}>
                  {STEPS.map((item, stepIndex) => (
                    <FadeInView key={item.sense} delay={100 + stepIndex * 40} preset="soft">
                      <View
                        style={[
                          styles.sensePreview,
                          {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.radius.lg,
                            padding: theme.spacing.md,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.accentBar,
                            { backgroundColor: theme.colors.primaryMuted },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewIcon,
                            { backgroundColor: theme.colors.primaryMuted },
                          ]}
                        >
                          <Icon name={item.sense} size={18} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyStrong">
                            {item.count} · {item.senseLabel}
                          </Text>
                          <Text variant="caption" color="textMuted" numberOfLines={1}>
                            {item.prompt}
                          </Text>
                        </View>
                      </View>
                    </FadeInView>
                  ))}
                </View>
              </FadeInView>
            </View>
          ) : finished ? (
            <>
              <LivingLeaf size={88} variant="celebrate" />
              <Text variant="title" center style={{ marginTop: theme.spacing.lg }}>
                Welcome back
              </Text>
              <Text
                variant="body"
                color="textSecondary"
                center
                style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}
              >
                Notice how you feel now compared to a minute ago. You did that.
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.xl, letterSpacing: 0.6 }}
              >
                HOW DO YOU FEEL?
              </Text>
              <View style={[styles.feelingRow, { marginTop: theme.spacing.md }]}>
                <PressableScale
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Calmer"
                  style={[
                    styles.feelingBtn,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}
                >
                  <Text variant="bodyStrong" color="primary">
                    Calmer
                  </Text>
                </PressableScale>
                <PressableScale
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="About the same"
                  style={[
                    styles.feelingBtn,
                    { backgroundColor: theme.colors.surfaceAlt },
                  ]}
                >
                  <Text variant="bodyStrong" color="textMuted">
                    About the same
                  </Text>
                </PressableScale>
              </View>
            </>
          ) : step ? (
            <View
              style={[
                styles.stageShell,
                {
                  backgroundColor: theme.colors.primaryMuted,
                  borderRadius: theme.radius.xl,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.xl,
                },
              ]}
            >
              <LivingLeaf size={40} variant="ground" showAura={false} />
              <Text
                variant="caption"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.sm, letterSpacing: 0.6 }}
              >
                NOTICE THIS SENSE
              </Text>

              <View
                style={[
                  styles.senseOrb,
                  {
                    backgroundColor: theme.colors.surface,
                    marginTop: theme.spacing.xl,
                  },
                ]}
              >
                <Icon name={step.sense} size={36} color={theme.colors.primary} />
              </View>

              <Text
                variant="display"
                color="primary"
                style={{ marginTop: theme.spacing.md, letterSpacing: 1 }}
              >
                {step.count}
              </Text>
              <Text
                variant="subtitle"
                color="primary"
                center
                style={{ marginTop: 4, letterSpacing: 0.4 }}
              >
                {step.senseLabel}
              </Text>
              <Text
                variant="body"
                color="textSecondary"
                center
                style={{ marginTop: theme.spacing.md, maxWidth: 280 }}
              >
                {step.prompt}
              </Text>

              <StepProgress current={index} total={STEPS.length} />
            </View>
          ) : null}
        </Animated.View>
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        {!started ? (
          <Button label="Begin" onPress={next} />
        ) : finished ? (
          <>
            <Button
              label="Do it again"
              onPress={() => {
                setIndex(0);
                setRecorded(false);
              }}
            />
            <Button label="Done" variant="ghost" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <Button label={index === STEPS.length - 1 ? 'Finish' : 'Next'} onPress={next} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  sensePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    paddingLeft: 16,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageShell: {
    width: '100%',
    alignItems: 'center',
  },
  senseOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    marginTop: 24,
  },
  pips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  feelingRow: { flexDirection: 'row', gap: 12 },
  feelingBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
});
