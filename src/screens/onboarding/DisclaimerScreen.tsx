import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { MEDICAL_DISCLAIMER } from '@/constants/app';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import { Icon } from '@/ui';
import { generateTodayPlan } from '@/wellness/planService';
import { logger } from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Disclaimer'>;

export function DisclaimerScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const acceptDisclaimer = useSettingsStore((s) => s.acceptDisclaimer);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const fromSettings = route.params?.fromSettings ?? false;
  const [busy, setBusy] = useState(false);

  const handleAgree = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      acceptDisclaimer();
      try {
        await generateTodayPlan({ force: true, personalize: true });
      } catch (error) {
        logger.warn('First plan generation failed; continuing onboarding', {
          error: String(error),
        });
      }
      completeOnboarding();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Home' } }],
      });
    } finally {
      setBusy(false);
    }
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

      <View
        style={{
          backgroundColor: theme.colors.warningMuted,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Icon name="warning" size={20} color={theme.colors.warning} />
          <Text variant="bodyStrong" style={{ color: theme.colors.warning }}>
            Please read carefully
          </Text>
        </View>
        <Text variant="body" color="text">
          {MEDICAL_DISCLAIMER}
        </Text>
      </View>

      <View
        style={{
          marginTop: theme.spacing.md,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
          <Icon name="shield" size={20} color={theme.colors.textMuted} />
          <Text variant="body" color="textMuted" style={{ flex: 1 }}>
            If you are ever in crisis or danger, Oppuna will pause and guide you toward emergency
            services and people you trust. It will never try to handle an emergency on its own.
          </Text>
        </View>
      </View>

      {!fromSettings ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button
            label={t('disclaimerScreen.agree')}
            onPress={() => void handleAgree()}
            loading={busy}
            disabled={busy}
          />
        </View>
      ) : null}
    </Screen>
  );
}
