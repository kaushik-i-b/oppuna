import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Button, Text } from '@/components';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { useModelStatus } from '@/hooks/useModelStatus';
import {
  cancelOnDeviceModelDownload,
  downloadOnDeviceModel,
  getModelDownloadSnapshot,
  modelDownloadErrorMessage,
  removeDownloadedOnDeviceModel,
  subscribeModelDownload,
  type ModelDownloadSnapshot,
} from '@/services/modelDownloadService';
import { modelDownloadPercent } from '@/services/modelDownloadPolicy';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Settings control for the optional Qwen download.
 * The base install stays small; guided replies work until the file is present.
 */
export function ModelDownloadControls(): React.ReactElement | null {
  const theme = useTheme();
  const model = useModelStatus();
  const [download, setDownload] = useState<ModelDownloadSnapshot>(getModelDownloadSnapshot);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeModelDownload(setDownload), []);

  if (Platform.OS !== 'android') return null;

  const ready = model.status === 'ready' || model.status === 'generating';
  const downloading = download.phase === 'downloading' || download.phase === 'preparing';
  const percent = modelDownloadPercent(download.bytesDownloaded, download.totalBytes);
  const receivedMb = Math.floor(download.bytesDownloaded / (1024 * 1024));
  const totalMb = Math.max(1, Math.round(LOCAL_MODEL_CONFIG.expectedSize / (1024 * 1024)));

  async function start(): Promise<void> {
    setBusy(true);
    try {
      await downloadOnDeviceModel();
    } catch (error) {
      const current = getModelDownloadSnapshot();
      setDownload({
        ...current,
        phase: 'error',
        error:
          current.error ??
          (error instanceof Error ? error.message : modelDownloadErrorMessage(error)),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text variant="body" color="textMuted">
        The on-device model is a separate download (about 941 MB), so the app
        install stays smaller. Guided replies work without it. After it
        downloads, chat still runs on this phone.
      </Text>
      {downloading ? (
        <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
          {download.phase === 'preparing'
            ? 'Checking the model…'
            : percent === null
              ? 'Downloading the on-device model…'
              : `Downloaded ${receivedMb} MB of ${totalMb} MB (${percent}%)`}
        </Text>
      ) : null}
      {download.error ? (
        <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
          {download.error}
        </Text>
      ) : null}
      {!ready ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            label={downloading ? 'Downloading model…' : 'Download on-device model'}
            onPress={() => {
              void start();
            }}
            loading={busy || downloading}
            disabled={busy || downloading}
          />
        </View>
      ) : (
        <Text variant="bodyStrong" style={{ marginTop: theme.spacing.md }}>
          On-device model is ready.
        </Text>
      )}
      {downloading ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label="Cancel download"
            variant="secondary"
            onPress={() => {
              void cancelOnDeviceModelDownload();
            }}
          />
        </View>
      ) : null}
      {ready ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label="Remove downloaded model"
            variant="danger"
            onPress={() => {
              void removeDownloadedOnDeviceModel();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
