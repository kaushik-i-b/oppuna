import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, ConfirmDialog, Screen, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { deleteAllData } from '@/services/dataExport';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteData'>;

export function DeleteDataScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const resetPreferences = useSettingsStore((s) => s.resetPreferences);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async (): Promise<void> => {
    setConfirm(false);
    setBusy(true);
    const result = await deleteAllData();
    setBusy(false);
    if (result.ok) {
      toast.show('All your data has been deleted.', 'success');
      // Flips onboardingComplete → RootNavigator remounts into welcome flow.
      resetPreferences();
    } else {
      toast.show(result.error.message, 'error');
    }
  };

  return (
    <Screen title={t('settings.deleteData')} onBack={() => navigation.goBack()} scroll>
      <Card style={{ backgroundColor: theme.colors.dangerMuted }}>
        <Text variant="subtitle" color="danger">
          Delete everything
        </Text>
        <Text variant="body" color="text" style={{ marginTop: theme.spacing.sm }}>
          This permanently removes all your moods, journal entries, conversations, breathing
          sessions, and voice notes from this device. You will also return to the welcome
          onboarding.
        </Text>
        <Text variant="bodyStrong" color="danger" style={{ marginTop: theme.spacing.sm }}>
          This cannot be undone.
        </Text>
      </Card>

      <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.md }}>
        Consider exporting your data first if you would like to keep a copy.
      </Text>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button
          label="Delete all data"
          variant="danger"
          onPress={() => setConfirm(true)}
          loading={busy}
        />
      </View>

      <ConfirmDialog
        visible={confirm}
        title="Delete all data?"
        message="Everything you have saved in Oppuna will be permanently erased, and onboarding will start again."
        confirmLabel="Delete everything"
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  );
}
