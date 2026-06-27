import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, ListItem, Screen, SectionHeader, Text } from '@/components';
import { LANGUAGES } from '@/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

export function LanguageScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const fromSettings = route.params?.fromSettings ?? false;

  return (
    <Screen
      scroll
      title={fromSettings ? t('settings.language') : undefined}
      onBack={fromSettings ? () => navigation.goBack() : undefined}
    >
      {!fromSettings ? (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="title">Choose your language</Text>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
            You can change this any time in Settings.
          </Text>
        </View>
      ) : null}

      <SectionHeader title="Language" />
      <Card padded={false}>
        <View style={{ gap: 1 }}>
          {LANGUAGES.map((lang) => (
            <ListItem
              key={lang.code}
              title={lang.native}
              subtitle={lang.label}
              trailing={
                language === lang.code ? (
                  <Text variant="subtitle" color="primary">
                    ✓
                  </Text>
                ) : null
              }
              onPress={() => setLanguage(lang.code)}
            />
          ))}
        </View>
      </Card>

      {!fromSettings ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label={t('common.continue')} onPress={() => navigation.navigate('Privacy')} />
        </View>
      ) : null}
    </Screen>
  );
}
