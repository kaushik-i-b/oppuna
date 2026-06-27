import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';

import { Button, Card, Screen, SectionHeader, Text } from '@/components';
import { SLEEP_SUGGESTIONS } from '@/services/offlineAI';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Sleep'>;

const WIND_DOWN = [
  'Dim the lights around you',
  'Put the phone a little out of reach',
  'Let your shoulders and jaw soften',
  'Take five slow breaths, longer on the exhale',
];

const SLEEP_SCRIPT =
  'Let your body grow heavy and still. Breathe in slowly for four. Hold for seven. ' +
  'And release for eight, like a long, slow sigh. There is nothing to do now but rest.';

export function SleepScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);

  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );

  const toggle = useCallback((index: number) => {
    selection();
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }, [selection]);

  const speak = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(SLEEP_SCRIPT, {
      rate: 0.82,
      pitch: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking]);

  return (
    <Screen title="Sleep support" onBack={() => navigation.goBack()} scroll>
      <Card>
        <Text variant="subtitle">🌙 Wind down for rest</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          A calm body helps a busy mind let go. Try a few of these before sleep.
        </Text>
        <Button
          label={speaking ? 'Stop' : '🔊 Read a sleep wind-down'}
          variant={speaking ? 'secondary' : 'primary'}
          onPress={speak}
        />
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <SectionHeader title="Wind-down checklist" />
        <Card padded={false}>
          <View>
            {WIND_DOWN.map((item, index) => (
              <Pressable
                key={item}
                onPress={() => toggle(index)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!checked[index] }}
                style={[styles.checkRow, { padding: theme.spacing.lg }]}
              >
                <Text variant="subtitle">{checked[index] ? '✅' : '⬜️'}</Text>
                <Text variant="body" style={{ flex: 1 }}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <SectionHeader title="Gentle reminders" />
        <View style={{ gap: theme.spacing.sm }}>
          {SLEEP_SUGGESTIONS.map((tip) => (
            <Card key={tip}>
              <Text variant="body" color="textMuted">
                {tip}
              </Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="🫁 Breathe for sleep" onPress={() => navigation.navigate('Breathing')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
