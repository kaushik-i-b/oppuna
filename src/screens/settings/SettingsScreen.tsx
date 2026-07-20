import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Card, Chip, ListItem, Screen, SectionHeader, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { APP } from '@/constants/app';
import { LANGUAGES } from '@/i18n';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import { authenticate, getAppLockCapability } from '@/services/appLock';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeMode } from '@/theme/types';

const THEME_OPTIONS: { mode: ThemeMode; labelKey: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem' }[] = [
  { mode: 'light', labelKey: 'settings.themeLight' },
  { mode: 'dark', labelKey: 'settings.themeDark' },
  { mode: 'system', labelKey: 'settings.themeSystem' },
];

export function SettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const toast = useToast();
  const navigation = useAppNavigation();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const setAppLockEnabled = useSettingsStore((s) => s.setAppLockEnabled);
  const [appLockBusy, setAppLockBusy] = React.useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.code === language)?.native ?? 'English';

  const handleAppLockToggle = async (value: boolean): Promise<void> => {
    if (appLockBusy) return;
    setAppLockBusy(true);
    try {
      if (value) {
        const capability = await getAppLockCapability();
        if (!capability.available) {
          toast.show(t('settings.appLockUnavailable'), 'error');
          return;
        }
        const ok = await authenticate({
          promptMessage: t('lock.setupPrompt'),
          cancelLabel: t('common.cancel'),
        });
        if (!ok) {
          toast.show(t('settings.appLockNotVerified'), 'info');
          return;
        }
        setAppLockEnabled(true);
        toast.show(t('settings.appLockEnabled'), 'success');
      } else {
        const ok = await authenticate({
          promptMessage: t('lock.disablePrompt'),
          cancelLabel: t('common.cancel'),
        });
        if (!ok) {
          toast.show(t('settings.appLockNotVerified'), 'info');
          return;
        }
        setAppLockEnabled(false);
        toast.show(t('settings.appLockDisabled'), 'info');
      }
    } finally {
      setAppLockBusy(false);
    }
  };

  return (
    <Screen title={t('settings.title')} scroll>
      <SectionHeader title={t('settings.appearance')} />
      <Card>
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
          {t('settings.theme')}
        </Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.mode}
              label={t(option.labelKey)}
              selected={themeMode === option.mode}
              onPress={() => setThemeMode(option.mode)}
            />
          ))}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title="Preferences" />
        <View style={{ gap: theme.spacing.sm }}>
          <ListItem
            leadingEmoji="🌐"
            title={t('settings.language')}
            subtitle={currentLanguage}
            onPress={() => navigation.navigate('Language', { fromSettings: true })}
          />
          <ListItem
            leadingEmoji="🧠"
            title={t('settings.aiModel')}
            subtitle={t('settings.aiModelDescription')}
            onPress={() => navigation.navigate('AIModel')}
          />
          <Card>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{t('settings.appLock')}</Text>
                <Text variant="caption" color="textMuted">
                  {t('settings.appLockDescription')}
                </Text>
              </View>
              <Switch
                value={appLockEnabled}
                disabled={appLockBusy}
                onValueChange={(value) => {
                  void handleAppLockToggle(value);
                }}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </Card>
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title="Privacy & data" />
        <View style={{ gap: theme.spacing.sm }}>
          <ListItem
            leadingEmoji="🔒"
            title={t('settings.privacy')}
            onPress={() => navigation.navigate('Privacy', { fromSettings: true })}
          />
          <ListItem
            leadingEmoji="⚕️"
            title={t('settings.disclaimer')}
            onPress={() => navigation.navigate('Disclaimer', { fromSettings: true })}
          />
          <ListItem
            leadingEmoji="📄"
            title={t('settings.terms')}
            onPress={() => navigation.navigate('Terms')}
          />
          <ListItem
            leadingEmoji="📤"
            title={t('settings.exportData')}
            onPress={() => navigation.navigate('DataExport')}
          />
          <ListItem
            leadingEmoji="🗑️"
            title={t('settings.deleteData')}
            danger
            onPress={() => navigation.navigate('DeleteData')}
          />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <SectionHeader title="About" />
        <ListItem
          leadingEmoji="🌿"
          title={t('settings.about')}
          subtitle={`Version ${APP.version}`}
          onPress={() => navigation.navigate('About')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
