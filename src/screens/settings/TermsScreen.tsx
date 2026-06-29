import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, Screen, Text } from '@/components';
import { APP, MEDICAL_DISCLAIMER, TERMS_OF_USE } from '@/constants/app';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

export function TermsScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Screen title={t('settings.terms')} onBack={() => navigation.goBack()} scroll>
      <Card>
        <Text variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
          Terms of use
        </Text>
        <Text variant="body" color="textMuted">
          {TERMS_OF_USE}
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.dangerMuted }}>
        <Text variant="bodyStrong" color="danger" style={{ marginBottom: theme.spacing.sm }}>
          Not a medical service
        </Text>
        <Text variant="body" color="text">
          {MEDICAL_DISCLAIMER}
        </Text>
      </Card>

      <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.lg }}>
        {APP.name} v{APP.version}. These terms may be updated with future app releases.
      </Text>
    </Screen>
  );
}
