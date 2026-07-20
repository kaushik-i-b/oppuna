import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Screen, Text } from '@/components';
import { MEDICAL_DISCLAIMER } from '@/constants/app';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Disclaimer'>;

export function DisclaimerScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const acceptDisclaimer = useSettingsStore((s) => s.acceptDisclaimer);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const fromSettings = route.params?.fromSettings ?? false;

  const handleAgree = (): void => {
    acceptDisclaimer();
    completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Home' } }],
    });
  };

  return (
    <Screen
      scroll
      title={fromSettings ? t('settings.disclaimer') : undefined}
      onBack={fromSettings ? () => navigation.goBack() : undefined}
    >
      <Text variant="title" style={{ marginBottom: theme.spacing.md }}>
        {t('disclaimerScreen.title')}
      </Text>

      <Card style={{ backgroundColor: theme.colors.dangerMuted }}>
        <Text variant="bodyStrong" color="danger" style={{ marginBottom: theme.spacing.sm }}>
          Please read carefully
        </Text>
        <Text variant="body" color="text">
          {MEDICAL_DISCLAIMER}
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md }}>
        <Text variant="body" color="textMuted">
          If you are ever in crisis or danger, Oppuna will pause and guide you toward emergency
          services and people you trust. It will never try to handle an emergency on its own.
        </Text>
      </Card>

      {!fromSettings ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label={t('disclaimerScreen.agree')} onPress={handleAgree} />
        </View>
      ) : null}
    </Screen>
  );
}
