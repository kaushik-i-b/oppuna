import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Button,
  Card,
  ConfirmDialog,
  Screen,
  SectionHeader,
  Text,
} from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  MENTAL_HEALTH_AGENT,
  describeAgent,
  getLocalLLMClient,
  getModelsDirectory,
  installModelFromUri,
  removeInstalledModel,
} from '@/ai';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { MentalHealthAgentStatus } from '@/ai';
import type { RootStackParamList } from '@/navigation/types';
import type { TranslationKey } from '@/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'MentalHealthAgent'>;

const MAX_MODEL_BYTES = 6 * 1024 * 1024 * 1024;

function formatBytes(size: number | null): string | null {
  if (size == null || Number.isNaN(size) || size <= 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function statusLabelKey(status: MentalHealthAgentStatus): TranslationKey {
  switch (status) {
    case 'ready':
      return 'agent.statusReady';
    case 'loading':
      return 'agent.statusLoading';
    case 'checking':
      return 'agent.statusChecking';
    case 'error':
      return 'agent.statusError';
    case 'unavailable':
    default:
      return 'agent.statusUnavailable';
  }
}

export function MentalHealthAgentScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const modelState = useModelStatus();
  const [busy, setBusy] = useState<'install' | 'remove' | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [installedSize, setInstalledSize] = useState<number | null>(null);

  const agent = useMemo(() => describeAgent(modelState), [modelState]);
  const statusText = t(statusLabelKey(agent.status));
  const showStatusSpinner = agent.status === 'checking' || agent.status === 'loading';
  const modelsDir = getModelsDirectory();

  useEffect(() => {
    let active = true;
    if (!agent.modelPath) {
      setInstalledSize(null);
      return;
    }
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(agent.modelPath as string);
        if (!active) return;
        if (info.exists && !info.isDirectory) {
          setInstalledSize(info.size);
        } else {
          setInstalledSize(null);
        }
      } catch (error) {
        logger.warn('Could not read installed model size', { error: String(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, [agent.modelPath]);

  const statusColor =
    agent.status === 'ready'
      ? theme.colors.primary
      : agent.status === 'error'
        ? theme.colors.danger
        : theme.colors.textMuted;

  const runInstallFlow = useCallback(async () => {
    if (busy) return;
    try {
      setBusy('install');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const asset = result.assets[0];
      if (!asset) return;

      const name = (asset.name ?? '').toLowerCase();
      if (!name.endsWith('.gguf')) {
        toast.show(t('agent.errorNotGguf'), 'error');
        return;
      }
      if (typeof asset.size === 'number' && asset.size > MAX_MODEL_BYTES) {
        toast.show(t('agent.errorTooLarge'), 'error');
        return;
      }

      const client = getLocalLLMClient();
      if (client.release) {
        try {
          await client.release();
        } catch (error) {
          logger.warn('Failed to release existing LLM context before install', {
            error: String(error),
          });
        }
      }

      const outcome = await installModelFromUri(asset.uri, { filename: asset.name });
      setInstalledSize(outcome.sizeBytes ?? asset.size ?? null);
      toast.show(t('agent.installed'), 'success');

      if (client.warmUp) {
        client.warmUp().catch((error: unknown) => {
          logger.warn('Warm-up after install failed; will retry on next chat', {
            error: String(error),
          });
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Mental health agent install failed', { error: message });
      toast.show(t('agent.errorInstallFailed'), 'error');
    } finally {
      setBusy(null);
    }
  }, [busy, t, toast]);

  const runRemoveFlow = useCallback(async () => {
    setConfirmRemove(false);
    if (busy) return;
    try {
      setBusy('remove');
      const client = getLocalLLMClient();
      if (client.release) {
        try {
          await client.release();
        } catch (error) {
          logger.warn('Failed to release LLM context before removal', {
            error: String(error),
          });
        }
      }
      await removeInstalledModel();
      setInstalledSize(null);
      toast.show(t('agent.removed'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Mental health agent removal failed', { error: message });
      toast.show(t('agent.errorRemoveFailed'), 'error');
    } finally {
      setBusy(null);
    }
  }, [busy, t, toast]);

  const modelSizeLabel = formatBytes(installedSize);

  return (
    <Screen title={t('agent.title')} onBack={() => navigation.goBack()} scroll>
      <Card>
        <View style={styles.headerRow}>
          <Text variant="display">🧠</Text>
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text variant="subtitle">{agent.displayName}</Text>
            <Text variant="caption" color="textMuted">
              {MENTAL_HEALTH_AGENT.tagline}
            </Text>
          </View>
        </View>
        <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.md }}>
          {MENTAL_HEALTH_AGENT.description}
        </Text>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('agent.statusSection')} />
        <Card>
          <View style={styles.statusRow}>
            {showStatusSpinner ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor },
                ]}
              />
            )}
            <Text
              variant="bodyStrong"
              style={{ marginLeft: theme.spacing.sm, color: statusColor }}
            >
              {statusText}
            </Text>
          </View>
          {agent.error ? (
            <Text
              variant="caption"
              color="danger"
              style={{ marginTop: theme.spacing.sm }}
            >
              {agent.error}
            </Text>
          ) : null}
          {agent.modelId ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <Text variant="caption" color="textMuted">
                {t('agent.modelLabel')}
              </Text>
              <Text variant="body">{agent.modelId}</Text>
              {modelSizeLabel ? (
                <Text
                  variant="caption"
                  color="textFaint"
                  style={{ marginTop: 2 }}
                >
                  {modelSizeLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Card>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('agent.installSection')} />
        <Card>
          <Text variant="body" color="textMuted">
            {t('agent.installBody')}
          </Text>
          <Text
            variant="caption"
            color="textFaint"
            style={{ marginTop: theme.spacing.sm }}
          >
            {t('agent.recommendedIntro')}
          </Text>
          {MENTAL_HEALTH_AGENT.recommendedModels.map((name) => (
            <Text
              key={name}
              variant="caption"
              color="textMuted"
              style={{ marginTop: 2 }}
            >
              • {name}
            </Text>
          ))}
          <View style={{ marginTop: theme.spacing.md }}>
            <Button
              label={
                busy === 'install'
                  ? t('agent.installBusy')
                  : agent.modelId
                    ? t('agent.replaceCta')
                    : t('agent.installCta')
              }
              onPress={() => void runInstallFlow()}
              loading={busy === 'install'}
              disabled={busy !== null}
            />
          </View>
          {agent.modelId ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button
                variant="ghost"
                label={
                  busy === 'remove' ? t('agent.removeBusy') : t('agent.removeCta')
                }
                onPress={() => setConfirmRemove(true)}
                loading={busy === 'remove'}
                disabled={busy !== null}
              />
            </View>
          ) : null}
        </Card>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('agent.privacySection')} />
        <Card>
          <Text variant="body" color="textMuted">
            {t('agent.privacyBody')}
          </Text>
          <Text
            variant="caption"
            color="textFaint"
            style={{ marginTop: theme.spacing.sm }}
          >
            {t('agent.storagePathIntro')}
          </Text>
          <Text variant="caption" color="textMuted">
            {modelsDir}
          </Text>
        </Card>
      </View>

      <View
        style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}
      >
        <SectionHeader title={t('agent.aboutSection')} />
        <Card>
          <Text variant="body" color="textMuted">
            {t('agent.aboutBody')}
          </Text>
          <Text
            variant="caption"
            color="textFaint"
            style={{ marginTop: theme.spacing.sm }}
          >
            {t('agent.runtimeLabel')}
          </Text>
          <Text variant="body">{agent.runtime}</Text>
        </Card>
      </View>

      <ConfirmDialog
        visible={confirmRemove}
        title={t('agent.removeCta')}
        message={t('agent.removeConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void runRemoveFlow()}
        onCancel={() => setConfirmRemove(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
});
