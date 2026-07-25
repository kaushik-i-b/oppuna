/**
 * Development-only diagnostics for the on-device local LLM.
 * Hidden from production users (__DEV__ gate + Settings entry).
 * Does not display private conversation content.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components';
import { useModelStatus } from '@/hooks/useModelStatus';
import { retryModelInitialization, unloadModel } from '@/ai/modelManager';
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';
import { getDeviceCapability } from '@/services/deviceCapabilityService';
import { getModelMetadata } from '@/services/modelAssetService';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { useTheme } from '@/theme/ThemeProvider';

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

function presentLabel(value: boolean | null): string {
  if (value === true) return 'present';
  if (value === false) return 'absent';
  return 'unknown';
}

function integrityLabel(value: boolean | null): string {
  if (value === true) return 'ok';
  if (value === false) return 'failed';
  return 'not verified';
}

export function LocalAIDiagnosticsScreen(): React.ReactElement {
  const theme = useTheme();
  const model = useModelStatus();
  const capability = getDeviceCapability();
  const meta = getModelMetadata();
  const [busy, setBusy] = useState(false);
  // Re-read on each render; model status subscription already re-renders this screen.
  const diagnostics = getModelDiagnosticStatus();

  const handleRetry = useCallback(async () => {
    setBusy(true);
    try {
      await retryModelInitialization();
    } finally {
      setBusy(false);
    }
  }, []);

  const handleUnload = useCallback(async () => {
    setBusy(true);
    try {
      await unloadModel();
    } finally {
      setBusy(false);
    }
  }, []);

  const memoryLabel =
    capability.totalMemory === null
      ? 'unknown'
      : `${(capability.totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB (est.)`;

  return (
    <Screen title="AI diagnostics" scroll>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.md }}>
        Development only. No conversation content is shown. Values reflect real local state — never a fake PASS.
      </Text>

      <Card>
        <Row label="AI state" value={model.status.toUpperCase()} />
        <Row label="Engine mode" value={diagnostics.engineMode} />
        <Row label="Exact model" value={diagnostics.exactModel} />
        <Row label="Display name" value={LOCAL_MODEL_CONFIG.displayName} />
        <Row label="Family / quant" value={`${diagnostics.family} / ${diagnostics.quantization}`} />
        <Row label="Model id" value={model.modelId ?? meta.modelName} />
        <Row label="Model version" value={meta.version} />
        <Row label="Model presence" value={presentLabel(diagnostics.modelPresent)} />
        <Row label="Integrity" value={integrityLabel(diagnostics.integrityOk)} />
        <Row
          label="Expected size"
          value={`${(LOCAL_MODEL_CONFIG.expectedSize / (1024 * 1024)).toFixed(0)} MB`}
        />
        <Row label="SHA-256 (prefix)" value={diagnostics.sha256Prefix} />
        <Row label="Provider" value={model.providerId ?? '—'} />
        <Row label="Context size" value={model.contextSize?.toString() ?? '—'} />
        <Row label="Device tier" value={(model.deviceTier ?? capability.tier).toUpperCase()} />
        <Row
          label="Initialization time"
          value={model.initDurationMs != null ? `${model.initDurationMs} ms` : '—'}
        />
        <Row
          label="Generation"
          value={
            model.lastTokensPerSecond != null
              ? `${model.lastTokensPerSecond.toFixed(1)} tokens/sec`
              : '—'
          }
        />
        <Row
          label="Last response source"
          value={diagnostics.lastResponseSource ?? 'none yet'}
        />
        <Row label="Memory" value={memoryLabel} />
        <Row label="Path" value={model.modelPath ?? '—'} />
        <Row label="Error" value={model.error ?? '—'} />
      </Card>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Retry initialization" onPress={() => void handleRetry()} loading={busy} />
        <Button label="Unload model" variant="secondary" onPress={() => void handleUnload()} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
