import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Card, Chip, Screen, SectionHeader, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { APP } from '@/constants/app';
import { LANGUAGES, type TranslationKey } from '@/i18n';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';
import { authenticate, getAppLockCapability } from '@/services/appLock';
import {
  areCareRemindersSupported,
  syncCareReminders,
} from '@/services/careReminderService';
import { useSettingsStore } from '@/store/settingsStore';
import {
  COLOR_PALETTE_IDS,
  COLOR_PALETTES,
  type ColorPaletteId,
} from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeMode } from '@/theme/types';
import { Icon, StatusPill, type OppunaIconName } from '@/ui';

const THEME_OPTIONS: { mode: ThemeMode; labelKey: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem' }[] = [
  { mode: 'light', labelKey: 'settings.themeLight' },
  { mode: 'dark', labelKey: 'settings.themeDark' },
  { mode: 'system', labelKey: 'settings.themeSystem' },
];

const PALETTE_LABELS: Record<ColorPaletteId, TranslationKey> = {
  sage: 'settings.paletteSage',
  harbor: 'settings.paletteHarbor',
  blossom: 'settings.paletteBlossom',
  slate: 'settings.paletteSlate',
};

interface SettingsRowProps {
  icon: OppunaIconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  trailing,
  showChevron = true,
  isLast = false,
}: SettingsRowProps): React.ReactElement {
  const theme = useTheme();
  const iconColor = danger ? theme.colors.danger : theme.colors.textMuted;

  const content = (
    <View
      style={[
        styles.row,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <Icon name={icon} size={22} color={iconColor} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress && showChevron ? (
          <Icon name="chevron" size={18} color={theme.colors.textFaint} />
        ) : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      {content}
    </Pressable>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

export function SettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const toast = useToast();
  const navigation = useAppNavigation();
  const modelState = useModelStatus();
  const aiStatus = getModelDiagnosticStatus();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const colorPalette = useSettingsStore((s) => s.colorPalette);
  const setColorPalette = useSettingsStore((s) => s.setColorPalette);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const setAppLockEnabled = useSettingsStore((s) => s.setAppLockEnabled);
  const careRemindersEnabled = useSettingsStore((s) => s.careRemindersEnabled);
  const setCareRemindersEnabled = useSettingsStore((s) => s.setCareRemindersEnabled);
  const [appLockBusy, setAppLockBusy] = React.useState(false);
  const [remindersBusy, setRemindersBusy] = React.useState(false);

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

  const handleCareRemindersToggle = async (value: boolean): Promise<void> => {
    if (remindersBusy) return;
    setRemindersBusy(true);
    try {
      if (value) {
        if (!areCareRemindersSupported()) {
          toast.show(t('settings.careRemindersUnavailable'), 'info');
          return;
        }
        const ok = await syncCareReminders(true);
        if (!ok) {
          setCareRemindersEnabled(false);
          toast.show(t('settings.careRemindersUnavailable'), 'error');
          return;
        }
        setCareRemindersEnabled(true);
        toast.show(t('settings.careRemindersEnabled'), 'success');
      } else {
        await syncCareReminders(false);
        setCareRemindersEnabled(false);
        toast.show(t('settings.careRemindersDisabled'), 'info');
      }
    } finally {
      setRemindersBusy(false);
    }
  };

  const aiTone =
    aiStatus.engineMode === 'guided-offline'
      ? 'warning'
      : aiStatus.status === 'ready'
        ? 'success'
        : 'neutral';

  return (
    <Screen title={t('settings.title')} scroll>
      <SectionHeader title={t('settings.aiEngine')} />
      <Card>
        <StatusPill label={aiStatus.title} tone={aiTone} />
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
          {aiStatus.subtitle}
        </Text>
        {__DEV__ && modelState.error ? (
          <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
            {modelState.error}
          </Text>
        ) : null}
        {aiStatus.engineMode === 'guided-offline' ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <SettingsGroup>
              <SettingsRow
                icon="leaf"
                title="Retry AI setup"
                subtitle="Try preparing the on-device model again"
                isLast
                onPress={() => {
                  void (async () => {
                    const { retryModelInitialization } = await import('@/ai/modelManager');
                    toast.show('Retrying on-device AI setup…', 'info');
                    await retryModelInitialization();
                  })();
                }}
              />
            </SettingsGroup>
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('settings.appearance')} />
        <Card>
          <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
            {t('settings.colorPalette')}
          </Text>
          <View style={styles.paletteRow}>
            {COLOR_PALETTE_IDS.map((id) => {
              const selected = colorPalette === id;
              const swatch = COLOR_PALETTES[id].swatch;
              return (
                <Pressable
                  key={id}
                  onPress={() => setColorPalette(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(PALETTE_LABELS[id])}
                  style={styles.paletteItem}
                >
                  <View
                    style={[
                      styles.paletteSwatch,
                      {
                        backgroundColor: swatch,
                        borderColor: selected ? theme.colors.text : theme.colors.border,
                        borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth * 2,
                      },
                    ]}
                  />
                  <Text
                    variant="caption"
                    style={{
                      marginTop: 6,
                      color: selected ? theme.colors.text : theme.colors.textMuted,
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {t(PALETTE_LABELS[id])}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            variant="bodyStrong"
            style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}
          >
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
        <SettingsGroup>
          <SettingsRow
            icon="settings"
            title={t('settings.language')}
            subtitle={currentLanguage}
            onPress={() => navigation.navigate('Language', { fromSettings: true })}
          />
          <View
            style={[
              styles.switchRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              },
            ]}
          >
            <Icon name="lock" size={22} color={theme.colors.textMuted} />
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
          <View
            style={[
              styles.switchRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              },
            ]}
          >
            <Icon name="bell" size={22} color={theme.colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t('settings.careReminders')}</Text>
              <Text variant="caption" color="textMuted">
                {t('settings.careRemindersDescription')}
              </Text>
            </View>
            <Switch
              value={careRemindersEnabled}
              disabled={remindersBusy}
              onValueChange={(value) => {
                void handleCareRemindersToggle(value);
              }}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </SettingsGroup>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('settings.legal')} />
        <SettingsGroup>
          <SettingsRow
            icon="privacy"
            title={t('settings.privacy')}
            onPress={() => navigation.navigate('Privacy', { fromSettings: true })}
          />
          <SettingsRow
            icon="info"
            title={t('settings.terms')}
            onPress={() => navigation.navigate('Terms')}
          />
          <SettingsRow
            icon="info"
            title={t('settings.thirdPartyLicenses')}
            subtitle={t('settings.thirdPartyLicensesSubtitle')}
            onPress={() => navigation.navigate('ThirdPartyLicenses')}
          />
          <SettingsRow
            icon="warning"
            title={t('settings.disclaimer')}
            onPress={() => navigation.navigate('Disclaimer', { fromSettings: true })}
            isLast
          />
        </SettingsGroup>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('settings.privacyData')} />
        <SettingsGroup>
          <SettingsRow
            icon="export"
            title={t('settings.exportData')}
            onPress={() => navigation.navigate('DataExport')}
          />
          <SettingsRow
            icon="trash"
            title={t('settings.deleteData')}
            danger
            onPress={() => navigation.navigate('DeleteData')}
            isLast
          />
        </SettingsGroup>
      </View>

      <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <SectionHeader title={t('settings.aboutSection')} />
        <SettingsGroup>
          <SettingsRow
            icon="insights"
            title="How Oppuna helps"
            subtitle="CBT-inspired tools, explained simply"
            onPress={() => navigation.navigate('HowOppunaHelps')}
          />
          <SettingsRow
            icon="leaf"
            title={t('settings.about')}
            subtitle={`Version ${APP.version}`}
            onPress={() => navigation.navigate('About')}
            isLast={!__DEV__}
          />
          {__DEV__ ? (
            <>
              <SettingsRow
                icon="settings"
                title={t('settings.developerDiagnostics')}
                subtitle="Local model status"
                onPress={() => navigation.navigate('LocalAIDiagnostics')}
              />
              <SettingsRow
                icon="check"
                title={t('settings.productionReadiness')}
                subtitle="Local self-check (dev only)"
                onPress={() => navigation.navigate('ProductionReadiness')}
                isLast
              />
            </>
          ) : null}
        </SettingsGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paletteItem: {
    flex: 1,
    alignItems: 'center',
  },
  paletteSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
});
