import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Chip, Screen, Text } from '@/components';
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
import {
  FadeInView,
  Icon,
  LivingLeaf,
  PressableScale,
  SectionLabel,
  StatusPill,
  type OppunaIconName,
} from '@/ui';
import { getWellnessPrefs } from '@/wellness/planService';
import { labelForGoals, labelForMoods } from '@/wellness/prefOptions';
import type { WellnessPrefs } from '@/wellness/types';
import { logger } from '@/utils/logger';

const THEME_OPTIONS: {
  mode: ThemeMode;
  labelKey: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem';
}[] = [
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

const PRIVACY_PILLARS = [
  { icon: 'shield' as const, label: 'Private by design' },
  { icon: 'leaf' as const, label: 'Offline AI' },
  { icon: 'journal' as const, label: 'Journal stays yours' },
];

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
  const iconColor = danger ? theme.colors.danger : theme.colors.primary;
  const wellBg = danger ? theme.colors.dangerMuted : theme.colors.primaryMuted;

  const content = (
    <View
      style={[
        styles.row,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <View style={[styles.iconWell, { backgroundColor: wellBg }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
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
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      scaleTo={0.99}
    >
      {content}
    </PressableScale>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }}
    >
      {children}
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
  isLast = false,
}: {
  icon: OppunaIconName;
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.switchRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <View style={[styles.iconWell, { backgroundColor: theme.colors.primaryMuted }]}>
        <Icon name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        thumbColor={theme.colors.surface}
      />
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
  const displayName = useSettingsStore((s) => s.displayName);
  const [prefs, setPrefs] = useState<WellnessPrefs | null>(null);

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
  const greetingName = displayName.trim() || 'you';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getWellnessPrefs()
        .then((next) => {
          if (active) setPrefs(next);
        })
        .catch((error) => logger.warn('Profile prefs load failed', { error: String(error) }));
      return () => {
        active = false;
      };
    }, []),
  );

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
      <FadeInView delay={0} preset="fade">
        <PressableScale
          onPress={() => navigation.navigate('EditProfile')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          scaleTo={0.99}
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroOrb,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <LivingLeaf size={40} variant="outline" showAura={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textFaint" style={{ letterSpacing: 1 }}>
                PROFILE
              </Text>
              <Text variant="title" style={{ marginTop: 2 }}>
                {displayName.trim() ? displayName.trim() : 'Add your name'}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                {displayName.trim()
                  ? `Private space for ${greetingName}`
                  : 'Tap to personalize your plan'}
              </Text>
            </View>
            <Icon name="chevron" size={20} color={theme.colors.primary} />
          </View>

          {prefs ? (
            <View style={[styles.prefSummary, { marginTop: theme.spacing.md }]}>
              <Text variant="caption" color="textSecondary">
                Feelings · {labelForMoods(prefs.moods)}
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                Goals · {labelForGoals(prefs.goals)}
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                Time · {prefs.availableMinutes || 15} min
              </Text>
            </View>
          ) : null}

          <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
            {t('settings.privacyHubBody')}
          </Text>

          <View style={[styles.pillarRow, { marginTop: theme.spacing.md }]}>
            {PRIVACY_PILLARS.map((pillar) => (
              <View
                key={pillar.label}
                style={[
                  styles.pillar,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Icon name={pillar.icon} size={16} color={theme.colors.primary} />
                <Text variant="caption" color="textMuted" style={{ marginTop: 6, textAlign: 'center' }}>
                  {pillar.label}
                </Text>
              </View>
            ))}
          </View>
        </PressableScale>
      </FadeInView>

      <FadeInView delay={30} style={{ marginTop: theme.spacing.lg }}>
        <SettingsGroup>
          <SettingsRow
            icon="profile"
            title="Edit profile"
            subtitle="Name, feelings, goals, and daily time"
            onPress={() => navigation.navigate('EditProfile')}
            isLast
          />
        </SettingsGroup>
      </FadeInView>

      {/* Premium extension point — disabled until billing ships.
      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionLabel>{t('settings.premiumSection').toUpperCase()}</SectionLabel>
        <Card>
          <Text variant="body" color="textMuted">{t('settings.premiumComingSoon')}</Text>
        </Card>
      </View>
      */}

      <FadeInView delay={50} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>{t('settings.aiEngine').toUpperCase()}</SectionLabel>
        <Card elevated style={{ backgroundColor: theme.colors.surfaceElevated }}>
          <View style={styles.aiHeader}>
            <StatusPill label={aiStatus.title} tone={aiTone} />
          </View>
          <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
            {aiStatus.subtitle}
          </Text>
          {__DEV__ && modelState.error ? (
            <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
              {modelState.error}
            </Text>
          ) : null}
          {aiStatus.engineMode === 'guided-offline' ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <ButtonLikeRow
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
      </FadeInView>

      <FadeInView delay={90} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>{t('settings.appearance').toUpperCase()}</SectionLabel>
        <Card elevated style={{ backgroundColor: theme.colors.surfaceElevated }}>
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
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        borderWidth: selected ? 3 : StyleSheet.hairlineWidth * 2,
                        transform: [{ scale: selected ? 1.06 : 1 }],
                      },
                    ]}
                  />
                  <Text
                    variant="caption"
                    style={{
                      marginTop: 8,
                      color: selected ? theme.colors.primary : theme.colors.textMuted,
                      fontWeight: selected ? '700' : '400',
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
      </FadeInView>

      <FadeInView delay={130} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>{t('settings.preferences').toUpperCase()}</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="settings"
            title={t('settings.language')}
            subtitle={currentLanguage}
            onPress={() => navigation.navigate('Language', { fromSettings: true })}
          />
          <SwitchRow
            icon="lock"
            title={t('settings.appLock')}
            subtitle={t('settings.appLockDescription')}
            value={appLockEnabled}
            disabled={appLockBusy}
            onValueChange={(value) => {
              void handleAppLockToggle(value);
            }}
          />
          <SwitchRow
            icon="bell"
            title={t('settings.careReminders')}
            subtitle={t('settings.careRemindersDescription')}
            value={careRemindersEnabled}
            disabled={remindersBusy}
            isLast
            onValueChange={(value) => {
              void handleCareRemindersToggle(value);
            }}
          />
        </SettingsGroup>
      </FadeInView>

      <FadeInView delay={170} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>{t('settings.legal').toUpperCase()}</SectionLabel>
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
            icon="warning"
            title={t('settings.disclaimer')}
            onPress={() => navigation.navigate('Disclaimer', { fromSettings: true })}
            isLast
          />
        </SettingsGroup>
      </FadeInView>

      <FadeInView delay={200} style={{ marginTop: theme.spacing.xl }}>
        <SectionLabel>{t('settings.privacyData').toUpperCase()}</SectionLabel>
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
      </FadeInView>

      <FadeInView delay={230} style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
        <SectionLabel>{t('settings.aboutSection').toUpperCase()}</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="insights"
            title="How Oppuna helps"
            subtitle="Your daily plan and gentle tools"
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
      </FadeInView>
    </Screen>
  );
}

function ButtonLikeRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.retryRow,
        {
          backgroundColor: theme.colors.surfaceInteractive,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Icon name="leaf" size={18} color={theme.colors.primary} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textMuted">
          {subtitle}
        </Text>
      </View>
      <Icon name="chevron" size={18} color={theme.colors.textFaint} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: {},
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefSummary: {},
  pillarRow: { flexDirection: 'row', gap: 8 },
  pillar: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
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
  rowText: { flex: 1 },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center' },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
});
