import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Card, Chip, ListItem, Screen, SectionHeader, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { APP } from '@/constants/app';
import { LANGUAGES } from '@/i18n';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';
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
  const modelState = useModelStatus();
  const aiStatus = getModelDiagnosticStatus();

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
      <SectionHeader title={t('settings.aiEngine')} />
      <Card>
        <Text variant="bodyStrong">{aiStatus.title}</Text>
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
          {aiStatus.subtitle}
        </Text>
        {__DEV__ && modelState.error ? (
          <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
            {modelState.error}
          </Text>
        ) : null}
        {aiStatus.engineMode === 'guided-offline' ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <ListItem
              leadingEmoji="♻️"
              title="Retry AI setup"
              subtitle="Try preparing the on-device model again"
              onPress={() => {
                void (async () => {
                  const { retryModelInitialization } = await import('@/ai/modelManager');
                  toast.show('Retrying on-device AI setup…', 'info');
                  await retryModelInitialization();
                })();
              }}
            />
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
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
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('settings.preferences')} />
        <View style={{ gap: theme.spacing.sm }}>
          <ListItem
            leadingEmoji="🌐"
            title={t('settings.language')}
            subtitle={currentLanguage}
            onPress={() => navigation.navigate('Language', { fromSettings: true })}
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
        <SectionHeader title={t('settings.legal')} />
        <View style={{ gap: theme.spacing.sm }}>
          <ListItem
            leadingEmoji="🔒"
            title={t('settings.privacy')}
            onPress={() => navigation.navigate('Privacy', { fromSettings: true })}
          />
          <ListItem
            leadingEmoji="📄"
            title={t('settings.terms')}
            onPress={() => navigation.navigate('Terms')}
          />
          <ListItem
            leadingEmoji="📚"
            title={t('settings.thirdPartyLicenses')}
            subtitle={t('settings.thirdPartyLicensesSubtitle')}
            onPress={() => navigation.navigate('ThirdPartyLicenses')}
          />
          <ListItem
            leadingEmoji="⚕️"
            title={t('settings.disclaimer')}
            onPress={() => navigation.navigate('Disclaimer', { fromSettings: true })}
          />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('settings.privacyData')} />
        <View style={{ gap: theme.spacing.sm }}>
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
        <SectionHeader title={t('settings.aboutSection')} />
        <ListItem
          leadingEmoji="🌿"
          title={t('settings.about')}
          subtitle={`Version ${APP.version}`}
          onPress={() => navigation.navigate('About')}
        />
        {__DEV__ ? (
          <>
            <ListItem
              leadingEmoji="🛠️"
              title={t('settings.developerDiagnostics')}
              subtitle="Local model status"
              onPress={() => navigation.navigate('LocalAIDiagnostics')}
            />
            <ListItem
              leadingEmoji="✅"
              title={t('settings.productionReadiness')}
              subtitle="Local self-check (dev only)"
              onPress={() => navigation.navigate('ProductionReadiness')}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
