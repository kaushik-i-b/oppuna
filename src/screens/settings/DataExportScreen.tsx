import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, ConfirmDialog, Screen, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { EXPORT_WARNING, exportData } from '@/services/dataExport';
import { authenticate } from '@/services/appLock';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DataExport'>;

export function DataExportScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useSecureScreen(true);

  const runExport = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      if (appLockEnabled) {
        const verified = await authenticate({
          promptMessage: t('lock.exportPrompt'),
          cancelLabel: t('common.cancel'),
        });
        if (!verified) {
          toast.show(t('settings.appLockNotVerified'), 'info');
          return;
        }
      }

      const result = await exportData();
      if (result.ok) {
        toast.show(t('settings.exportReady'), 'success');
      } else {
        toast.show(result.error.message, 'error');
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }, [appLockEnabled, t, toast]);

  return (
    <Screen title={t('settings.exportData')} onBack={() => navigation.goBack()} scroll>
      <Card>
        <Text variant="subtitle">📤 {t('settings.exportTitle')}</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          {t('settings.exportDescription')}
        </Text>
        <Text variant="caption" color="textFaint">
          {t('settings.exportPrivacyNote')}
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.dangerMuted }}>
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
          {t('common.confirm')}
        </Text>
        <Text variant="body" color="textMuted">
          {EXPORT_WARNING}
        </Text>
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button
          label={busy ? t('settings.exportPreparing') : t('settings.exportAction')}
          onPress={() => setConfirmOpen(true)}
          loading={busy}
        />
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        title={t('settings.exportData')}
        message={EXPORT_WARNING}
        confirmLabel={t('settings.exportAction')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void runExport()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}
