import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, ConfirmDialog, Screen, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { LLAMA_MODEL } from '@/constants/app';
import {
  cancelModelDownload,
  deleteModel,
  downloadModel,
  getLocalLLMClient,
} from '@/ai';
import { useModelDownload } from '@/hooks/useModelDownload';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AIModel'>;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function AIModelScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const modelState = useModelStatus();
  const download = useModelDownload();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDownloading = download.phase === 'downloading' || download.phase === 'finalizing';
  const isReady = modelState.status === 'ready' || modelState.status === 'idle';
  const hasModel = isReady && modelState.modelPath !== null;
  const percent = Math.round(download.progress * 100);

  const handleDownload = useCallback(async () => {
    const result = await downloadModel();
    if (result.phase === 'done') {
      toast.show(t('aiModel.downloadComplete'), 'success');
      const client = getLocalLLMClient();
      if (client.warmUp) {
        await client.warmUp().catch((error: unknown) => {
          logger.warn('Warm-up after download failed', { error: String(error) });
        });
      }
    } else if (result.phase === 'error') {
      toast.show(result.error ?? t('aiModel.downloadFailed'), 'error');
    }
  }, [t, toast]);

  const handleCancel = useCallback(async () => {
    await cancelModelDownload();
    toast.show(t('aiModel.downloadCancelled'), 'info');
  }, [t, toast]);

  const handleDelete = useCallback(async () => {
    setConfirmDelete(false);
    try {
      await deleteModel();
      toast.show(t('aiModel.deleted'), 'info');
    } catch (error) {
      logger.error('Delete model failed', { error: String(error) });
      toast.show(t('aiModel.downloadFailed'), 'error');
    }
  }, [t, toast]);

  return (
    <Screen title={t('aiModel.title')} onBack={() => navigation.goBack()} scroll>
      <Card>
        <Text variant="subtitle">🧠 {LLAMA_MODEL.displayName}</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          {t('aiModel.intro')}
        </Text>
        <Text variant="caption" color="textFaint">
          {t('aiModel.privacyNote')}
        </Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">{t('aiModel.statusLabel')}</Text>
          <Text
            variant="bodyStrong"
            color={hasModel ? 'primary' : isDownloading ? 'text' : 'textMuted'}
          >
            {hasModel
              ? t('aiModel.statusReady')
              : isDownloading
                ? t('aiModel.statusDownloading')
                : t('aiModel.statusNotInstalled')}
          </Text>
        </View>

        <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.xs }}>
          {`${LLAMA_MODEL.quantization} · ${LLAMA_MODEL.approxSizeLabel} · ${LLAMA_MODEL.license}`}
        </Text>

        {isDownloading ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.surfaceAlt,
                overflow: 'hidden',
              }}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: percent }}
            >
              <View
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              {download.phase === 'finalizing'
                ? t('aiModel.finalizing')
                : `${percent}% · ${formatBytes(download.bytesWritten)} / ${formatBytes(download.totalBytes)}`}
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
        {isDownloading ? (
          <Button label={t('aiModel.cancel')} variant="secondary" onPress={() => void handleCancel()} />
        ) : hasModel ? (
          <Button
            label={t('aiModel.delete')}
            variant="danger"
            onPress={() => setConfirmDelete(true)}
          />
        ) : (
          <Button label={t('aiModel.download')} onPress={() => void handleDownload()} />
        )}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title={t('aiModel.delete')}
        message={t('aiModel.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}
