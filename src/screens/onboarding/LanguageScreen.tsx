import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Screen, Text } from '@/components';
import { LANGUAGES } from '@/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import { Icon } from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

export function LanguageScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const fromSettings = route.params?.fromSettings ?? false;
  const selectedMeta = LANGUAGES.find((l) => l.code === language);

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

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
        }}
      >
        {LANGUAGES.map((lang, i) => {
          const selected = language === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomWidth: i < LANGUAGES.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: theme.colors.border,
                  backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{lang.native}</Text>
                <Text variant="caption" color="textFaint">
                  {lang.label}
                </Text>
              </View>
              {selected ? (
                <Icon name="check" size={20} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selectedMeta?.aiChatAvailable === false ? (
        <Text
          variant="caption"
          color="textMuted"
          style={{ marginTop: theme.spacing.md }}
        >
          {t('chat.kannadaComingSoon')}
        </Text>
      ) : null}

      {!fromSettings ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label={t('common.continue')} onPress={() => navigation.navigate('Privacy')} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
