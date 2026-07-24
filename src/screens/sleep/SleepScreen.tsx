import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';

import { Card, Screen, Text } from '@/components';
import { useHaptics } from '@/hooks/useHaptics';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { CareHero, FadeInView, Icon, LivingLeaf, PressableScale, SectionLabel } from '@/ui';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Sleep'>;

const WIND_DOWN = [
  'Dim the lights around you',
  'Put the phone a little out of reach',
  'Let your shoulders and jaw soften',
  'Take five slow breaths, longer on the exhale',
];

const BODY_SCAN_SCRIPT =
  'Starting at your toes, notice any tension. Let it soften. Move slowly up through your legs, ' +
  'your belly, your chest, your shoulders, and your face. There is nothing to fix — just notice.';

export function SleepScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [speaking, setSpeaking] = useState(false);
  const recordedRef = useRef(false);

  const allChecked = WIND_DOWN.every((_, i) => checked[i]);

  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );

  useEffect(() => {
    if (allChecked && !recordedRef.current) {
      recordedRef.current = true;
      void recordCareActivity('sleep');
    }
  }, [allChecked]);

  const toggle = useCallback(
    (index: number) => {
      selection();
      setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
    },
    [selection],
  );

  const speakBodyScan = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(BODY_SCAN_SCRIPT, {
      rate: 0.78,
      pitch: 0.92,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking]);

  return (
    <Screen title="Sleep support" onBack={() => navigation.goBack()} scroll>
      <FadeInView delay={0} preset="fade">
        <CareHero
          leafVariant={allChecked ? 'celebrate' : 'sleep'}
          leafSize={64}
          title="Ready to slow down?"
          body="A calm body helps a busy mind let go. Work through a few gentle steps."
        />
      </FadeInView>

      <FadeInView delay={80}>
        <SectionLabel>WIND DOWN</SectionLabel>
        <Card padded={false} style={{ backgroundColor: theme.colors.surfaceElevated }}>
          {WIND_DOWN.map((item, index) => (
            <PressableScale
              key={item}
              onPress={() => toggle(index)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!checked[index] }}
              scaleTo={0.99}
              style={[
                styles.checkRow,
                {
                  padding: theme.spacing.lg,
                  borderBottomWidth: index < WIND_DOWN.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.check,
                  {
                    borderColor: checked[index] ? theme.colors.primary : theme.colors.border,
                    backgroundColor: checked[index] ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                {checked[index] ? (
                  <Icon name="check" size={14} color={theme.colors.onPrimary} />
                ) : null}
              </View>
              <Text
                variant="body"
                style={{
                  flex: 1,
                  opacity: checked[index] ? 0.65 : 1,
                  textDecorationLine: checked[index] ? 'line-through' : 'none',
                }}
              >
                {item}
              </Text>
            </PressableScale>
          ))}
        </Card>
      </FadeInView>

      {allChecked ? (
        <FadeInView delay={40} preset="soft">
          <View
            style={[
              styles.completeBanner,
              {
                marginTop: theme.spacing.lg,
                backgroundColor: theme.colors.primaryMuted,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
              },
            ]}
          >
            <LivingLeaf size={36} variant="celebrate" showAura={false} />
            <Text variant="bodyStrong" color="primary" style={{ flex: 1 }}>
              Wind-down complete. Rest well.
            </Text>
          </View>
        </FadeInView>
      ) : null}

      <FadeInView delay={160} preset="lift">
        <View style={{ marginTop: theme.spacing.xl, gap: 4 }}>
          <SectionLabel>GO DEEPER</SectionLabel>
          <PressableScale
            onPress={() => navigation.navigate('Breathing')}
            accessibilityRole="button"
            accessibilityLabel="Breathing for sleep"
            scaleTo={0.99}
            style={[styles.linkRow, { borderBottomColor: theme.colors.border }]}
          >
            <Icon name="breathe" size={20} color={theme.colors.primary} />
            <Text variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Breathing for sleep
            </Text>
            <Icon name="chevron" size={18} color={theme.colors.textFaint} />
          </PressableScale>
          <PressableScale
            onPress={speakBodyScan}
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Stop body scan' : 'Body scan'}
            scaleTo={0.99}
            style={[styles.linkRow, { borderBottomColor: theme.colors.border }]}
          >
            <Icon name="selfcare" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text variant="body">{speaking ? 'Stop body scan' : 'Body scan'}</Text>
              <Text variant="caption" color="textMuted">
                A guided scan from toes to head
              </Text>
            </View>
            <Icon name="chevron" size={18} color={theme.colors.textFaint} />
          </PressableScale>
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBanner: { flexDirection: 'row', alignItems: 'center' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
