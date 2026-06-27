import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Screen, Text } from '@/components';
import { PRIVACY_STATEMENT } from '@/constants/app';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

const POINTS = [
  { emoji: '✈️', text: 'Works fully offline — no internet ever required.' },
  { emoji: '🔒', text: 'No login, no cloud sync, no analytics, no tracking.' },
  { emoji: '📱', text: 'Your notes, moods, and chats stay only on this device.' },
  { emoji: '🗑️', text: 'You can export or permanently delete your data anytime.' },
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
        <Text variant="title" style={{ marginBottom: theme.spacing.lg }}>
          Your privacy comes first
        </Text>
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        {POINTS.map((point) => (
          <Card key={point.text}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
              <Text variant="title">{point.emoji}</Text>
              <Text variant="body" style={{ flex: 1 }}>
                {point.text}
              </Text>
            </View>
          </Card>
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
