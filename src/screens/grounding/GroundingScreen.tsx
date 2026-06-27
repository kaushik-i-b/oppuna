import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Screen, Text } from '@/components';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Grounding'>;

interface GroundStep {
  count: number;
  sense: string;
  emoji: string;
  prompt: string;
}

const STEPS: GroundStep[] = [
  { count: 5, sense: 'see', emoji: '👀', prompt: 'Look around and name five things you can see.' },
  { count: 4, sense: 'feel', emoji: '✋', prompt: 'Notice four things you can physically feel.' },
  { count: 3, sense: 'hear', emoji: '👂', prompt: 'Listen for three things you can hear.' },
  { count: 2, sense: 'smell', emoji: '👃', prompt: 'Notice two things you can smell.' },
  { count: 1, sense: 'taste', emoji: '👅', prompt: 'Notice one thing you can taste.' },
];

export function GroundingScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const [index, setIndex] = useState(-1);

  const started = index >= 0;
  const finished = index >= STEPS.length;
  const step = started && !finished ? STEPS[index] : null;

  const next = (): void => {
    selection();
    setIndex((prev) => prev + 1);
  };

  return (
    <Screen title="Grounding" onBack={() => navigation.goBack()}>
      <View style={styles.center}>
        {!started ? (
          <>
            <Text variant="display">🌍</Text>
            <Text variant="title" center style={{ marginTop: theme.spacing.md }}>
              5-4-3-2-1
            </Text>
            <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.sm }}>
              A gentle way to come back to the present moment using your senses. Take it slowly.
            </Text>
          </>
        ) : finished ? (
          <>
            <Text variant="display">🌿</Text>
            <Text variant="title" center style={{ marginTop: theme.spacing.md }}>
              Welcome back
            </Text>
            <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.sm }}>
              Notice how you feel now compared to a minute ago. You did that.
            </Text>
          </>
        ) : step ? (
          <Card style={{ width: '100%', alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
            <Text variant="display">{step.emoji}</Text>
            <Text variant="title" color="primary" style={{ marginTop: theme.spacing.sm }}>
              {step.count}
            </Text>
            <Text variant="body" center style={{ marginTop: theme.spacing.sm }}>
              {step.prompt}
            </Text>
          </Card>
        ) : null}
      </View>

      {!started ? (
        <Button label="Begin" onPress={next} />
      ) : finished ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Do it again" onPress={() => setIndex(0)} />
          <Button label="Done" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <Button label={index === STEPS.length - 1 ? 'Finish' : 'Next'} onPress={next} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
