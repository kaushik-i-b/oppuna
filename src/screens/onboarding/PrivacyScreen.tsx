import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { PRIVACY_STATEMENT } from '@/constants/app';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import { Icon, LivingLeaf } from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

const POINTS = [
  'Private by Design — no login, no cloud sync, no analytics, no tracking.',
  'Offline AI — models and replies stay on this device.',
  'Your journal, moods, and wellness plans stay yours on this phone.',
  'You can export or permanently delete your data anytime.',
];

export function PrivacyScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const fromSettings = route.params?.fromSettings ?? false;

  return (
    <Screen
      scroll
      title={fromSettings ? t('settings.privacy') : undefined}
      onBack={fromSettings ? () => navigation.goBack() : undefined}
    >
      {!fromSettings ? (
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <LivingLeaf size={56} variant="outline" />
          <Text variant="title" center style={{ marginTop: theme.spacing.md }}>
            Your privacy comes first
          </Text>
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        {POINTS.map((point) => (
          <View
            key={point}
            style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start' }}
          >
            <Icon name="shield" size={20} color={theme.colors.primary} />
            <Text variant="body" style={{ flex: 1 }}>
              {point}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.lg }}>
        {PRIVACY_STATEMENT}
      </Text>

      {!fromSettings ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label={t('common.continue')} onPress={() => navigation.navigate('Disclaimer')} />
        </View>
      ) : null}
    </Screen>
  );
}
