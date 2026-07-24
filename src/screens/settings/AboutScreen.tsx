import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, Screen, Text } from '@/components';
import { APP, MEDICAL_DISCLAIMER } from '@/constants/app';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <Screen title={`About ${APP.name}`} onBack={() => navigation.goBack()} scroll>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
        <Text variant="display">🌿</Text>
        <Text variant="title" style={{ marginTop: theme.spacing.sm }}>
          {APP.name}
        </Text>
        <Text variant="caption" color="textMuted">
          Version {APP.version}
        </Text>
      </View>

      <Card>
        <Text variant="body">{APP.tagline}</Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md }}>
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
          What Oppuna is for
        </Text>
        <Text variant="body" color="textMuted">
          Oppuna offers gentle, everyday wellness support — a calm space to reflect, breathe, and
          notice how you feel. It runs entirely on your device.
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md }}>
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
          On-device AI
        </Text>
        <Text variant="body" color="textMuted">
          Oppuna uses an on-device AI model with safety checks and guided offline fallbacks.
          Processing happens locally on your device. AI outputs may be inaccurate and are not
          medical advice or emergency care.
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md }}>
        <Text variant="bodyStrong" color="danger" style={{ marginBottom: theme.spacing.sm }}>
          Important
        </Text>
        <Text variant="body" color="textMuted">
          {MEDICAL_DISCLAIMER}
        </Text>
      </Card>

      <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.xl }}>
        Built to work offline. No account, no cloud, no tracking.
      </Text>
    </Screen>
  );
}
