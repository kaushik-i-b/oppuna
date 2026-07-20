import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, ConfirmDialog, Screen, SectionHeader, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { getLocalLLMClient } from '@/ai/llmClient';
import { getActiveAgent } from '@/ai/mentalHealthAgent';
import { importModelFromUri, removeModel } from '@/ai/modelManager';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { ModelStatus } from '@/ai/types';
import type { RootStackParamList } from '@/navigation/types';
import type { TranslationKey } from '@/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'AIModel'>;

const STATUS_KEYS: Record<ModelStatus, TranslationKey> = {
  ready: 'aiModel.statusReady',
  idle: 'aiModel.statusIdle',
  checking: 'aiModel.statusChecking',
  loading: 'aiModel.statusLoading',
  unavailable: 'aiModel.statusUnavailable',
  error: 'aiModel.statusError',
};

export function AIModelScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const modelState = useModelStatus();
  const agent = getActiveAgent();

  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const hasModel = modelState.modelPath !== null;
  const statusBusy = modelState.status === 'checking' || modelState.status === 'loading';

  const handleImport = async (): Promise<void> => {
    if (busy) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.name?.toLowerCase().endsWith('.gguf')) {
        toast.show(t('aiModel.importFailed'), 'error');
        return;
      }

      setBusy(true);
      // Free the previous model context before swapping files underneath it.
      await getLocalLLMClient().release?.();
      const state = await importModelFromUri(asset.uri, asset.name);

      if (state.modelPath) {
        toast.show(t('aiModel.imported'), 'success');
        // Load the new weights in the background so chat is instant.
        void getLocalLLMClient()
          .warmUp?.()
          .catch((error: unknown) => {
            logger.warn('Model warm-up after import failed', { error: String(error) });
          });
      } else {
        toast.show(t('aiModel.importFailed'), 'error');
      }
    } catch (error) {
      logger.error('Model import failed', { error: String(error) });
      toast.show(t('aiModel.importFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setConfirmRemove(false);
    if (busy) return;
    setBusy(true);
    try {
      await getLocalLLMClient().release?.();
      await removeModel();
      toast.show(t('aiModel.removed'), 'info');
    } catch (error) {
      logger.error('Model removal failed', { error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('aiModel.title')} onBack={() => navigation.goBack()} scroll>
      <SectionHeader title={t('aiModel.agentTitle')} />
      <Card>
        <Text variant="subtitle">🧠 {agent.name}</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
          {t('aiModel.agentBody')}
        </Text>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('aiModel.modelTitle')} />
        <Card>
          <View style={styles.statusRow}>
            {statusBusy ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginRight: theme.spacing.sm }}
              />
            ) : null}
            <Text
              variant="bodyStrong"
              color={modelState.status === 'error' ? 'danger' : 'text'}
              style={{ flex: 1 }}
            >
              {t(STATUS_KEYS[modelState.status])}
            </Text>
          </View>
          {hasModel && modelState.modelId ? (
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
              {t('aiModel.activeModel')}: {modelState.modelId}
            </Text>
          ) : null}
          {modelState.error ? (
            <Text variant="caption" color="danger" style={{ marginTop: theme.spacing.sm }}>
              {modelState.error}
            </Text>
          ) : null}
        </Card>

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            label={busy ? t('aiModel.importing') : t('aiModel.import')}
            onPress={() => void handleImport()}
            loading={busy}
          />
          {hasModel ? (
            <Button
              label={t('aiModel.remove')}
              variant="ghost"
              onPress={() => setConfirmRemove(true)}
              disabled={busy}
            />
          ) : null}
        </View>

        <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.md }}>
          {t('aiModel.importHint')}
        </Text>
      </View>

      <ConfirmDialog
        visible={confirmRemove}
        title={t('aiModel.removeConfirmTitle')}
        message={t('aiModel.removeConfirmMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleRemove()}
        onCancel={() => setConfirmRemove(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center' },
});
