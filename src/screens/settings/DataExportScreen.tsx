import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Screen, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { exportData } from '@/services/dataExport';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DataExport'>;

export function DataExportScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleExport = async (): Promise<void> => {
    setBusy(true);
    const result = await exportData();
    setBusy(false);
    if (result.ok) {
      toast.show('Export ready. Choose where to save it.', 'success');
    } else {
      toast.show(result.error.message, 'error');
    }
  };

  return (
    <Screen title={t('settings.exportData')} onBack={() => navigation.goBack()} scroll>
      <Card>
        <Text variant="subtitle">📤 Take your data with you</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          This creates a single JSON file containing your moods, journal entries, conversations,
          breathing sessions, and voice note references.
        </Text>
        <Text variant="caption" color="textFaint">
          The file is created on your device. Sharing it afterward is entirely your choice and is
          handled by your phone — Oppuna never uploads anything.
        </Text>
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label={busy ? 'Preparing…' : 'Export as JSON'} onPress={() => void handleExport()} loading={busy} />
      </View>
    </Screen>
  );
}
