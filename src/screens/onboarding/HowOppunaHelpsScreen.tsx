import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Screen, Text } from '@/components';
import { APP } from '@/constants/app';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import {
  CareHero,
  FadeInView,
  Icon,
  SectionLabel,
  type OppunaIconName,
} from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'HowOppunaHelps'>;

interface HelpStep {
  icon: OppunaIconName;
  step: string;
  title: string;
  body: string;
}

const STEPS: HelpStep[] = [
  {
    icon: 'plan',
    step: '01',
    title: 'Your daily wellness plan',
    body: 'Oppuna builds a short, personalized plan from how you feel and what you want to work on — private and offline.',
  },
  {
    icon: 'mood',
    step: '02',
    title: 'Notice how you feel',
    body: 'Quick mood check-ins on Home help you see patterns over the week without judgment.',
  },
  {
    icon: 'journal',
    step: '03',
    title: 'Name the thought',
    body: 'Journal prompts and thought records separate what happened from the story your mind told.',
  },
  {
    icon: 'breathe',
    step: '04',
    title: 'Calm the body',
    body: 'Breathing, grounding, sleep wind-downs, and voice guides settle your nervous system.',
  },
  {
    icon: 'chat',
    step: '05',
    title: 'Supportive chat',
    body: 'Chat is secondary support for your plan — not a replacement for it. Crisis moments pause and guide you to real help.',
  },
];

export function HowOppunaHelpsScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <Screen title="How Oppuna helps" onBack={() => navigation.goBack()} scroll>
      <FadeInView delay={0} preset="fade">
        <CareHero
          leafVariant="greet"
          leafSize={68}
          title={APP.name}
          body="A private daily wellness plan — with gentle CBT-inspired tools when you need them."
        />
      </FadeInView>

      <FadeInView delay={60}>
        <View
          style={[
            styles.ideaBand,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
            },
          ]}
        >
          <Text variant="caption" color="primary" style={{ letterSpacing: 1.1, fontWeight: '700' }}>
            THE SIMPLE IDEA
          </Text>
          <Text variant="subtitle" style={{ marginTop: theme.spacing.sm }}>
            Thoughts, feelings, and small actions shape each other.
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
            When you catch a harsh thought and meet it kindly, feelings often ease — and a smaller
            next step becomes clearer. Oppuna helps you practice that gently, on this device only.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={110}>
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          {STEPS.map((item, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <View
                key={item.step}
                style={[
                  styles.stepRow,
                  {
                    padding: theme.spacing.lg,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.stepRail}>
                  <View
                    style={[
                      styles.stepIcon,
                      { backgroundColor: theme.colors.primaryMuted },
                    ]}
                  >
                    <Icon name={item.icon} size={18} color={theme.colors.primary} />
                  </View>
                  {!isLast ? (
                    <View
                      style={[
                        styles.stepLine,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingLeft: theme.spacing.md }}>
                  <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                    {item.step}
                  </Text>
                  <Text variant="bodyStrong" style={{ marginTop: 2 }}>
                    {item.title}
                  </Text>
                  <Text variant="body" color="textMuted" style={{ marginTop: 6 }}>
                    {item.body}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </FadeInView>

      <FadeInView delay={160} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>REMEMBER</SectionLabel>
        <Card
          elevated={false}
          style={{
            backgroundColor: theme.colors.warningMuted,
            borderWidth: 0,
          }}
        >
          <View style={styles.rememberHeader}>
            <Icon name="warning" size={18} color={theme.colors.warning} />
            <Text variant="bodyStrong" style={{ color: theme.colors.warning }}>
              Not therapy or emergency care
            </Text>
          </View>
          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
            Oppuna is a wellness companion for everyday reflection. It does not diagnose, treat, or
            replace professional care. If you are in danger, contact local emergency services or
            someone you trust.
          </Text>
        </Card>
      </FadeInView>

      <FadeInView delay={200} style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <Button
          label="Back to profile"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ideaBand: {},
  stepsCard: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stepRail: {
    width: 40,
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    marginBottom: -6,
    borderRadius: 1,
    minHeight: 16,
  },
  rememberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
