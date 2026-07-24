/**
 * Development-only production readiness diagnostics.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { Button, Card, Screen, Text } from '@/components';
import { APP } from '@/constants/app';
import { DATABASE_NAME } from '@/database/schema';
import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { getLastAIResponseSource } from '@/ai/responseSourceStore';
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';
import { getModelMetadata, isModelAvailable, verifyModelIntegrity } from '@/services/modelAssetService';
import { getAppLockCapability } from '@/services/appLock';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTheme } from '@/theme/ThemeProvider';

type CheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'BUILD-TIME VERIFIED';

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
}

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

export function ProductionReadinessScreen(): React.ReactElement {
  const theme = useTheme();
  const model = useModelStatus();
  const diagnostic = getModelDiagnosticStatus();
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [busy, setBusy] = useState(false);

  const runSelfCheck = useCallback(async () => {
    setBusy(true);
    const results: CheckResult[] = [];
    const meta = getModelMetadata();
    const lock = await getAppLockCapability();
    const modelPresent = await isModelAvailable();
    const lastSource = getLastAIResponseSource();

    results.push({
      name: 'Android backup disabled',
      status: 'BUILD-TIME VERIFIED',
      detail: 'Checked by npm run verify:privacy-config in CI',
    });

    results.push({
      name: 'INTERNET permission blocked',
      status: 'BUILD-TIME VERIFIED',
      detail: 'Checked by npm run verify:offline in CI',
    });

    results.push({
      name: 'Target SDK / manifest',
      status: 'BUILD-TIME VERIFIED',
      detail: 'Checked by npm run inspect:android-release in CI',
    });

    results.push({
      name: 'Model configured',
      status: meta.modelName === LOCAL_MODEL_CONFIG.id ? 'PASS' : 'FAIL',
      detail: meta.modelName,
    });

    results.push({
      name: 'Model present on device',
      status: modelPresent ? 'PASS' : 'FAIL',
      detail: modelPresent ? 'Private GGUF path resolved' : 'No model on device',
    });

    if (modelPresent) {
      const integrity = await verifyModelIntegrity({ forceFull: true });
      results.push({
        name: 'Model integrity',
        status: integrity.ok ? 'PASS' : 'FAIL',
        detail: integrity.ok ? 'Size/header/SHA verified' : (integrity.error ?? 'failed'),
      });
    }

    results.push({
      name: 'AI engine state',
      status:
        diagnostic.engineMode === 'on-device'
          ? 'PASS'
          : diagnostic.engineMode === 'initializing'
            ? 'WARN'
            : 'FAIL',
      detail: `${diagnostic.engineMode} (${model.status})`,
    });

    results.push({
      name: 'Fallback active',
      status: diagnostic.engineMode === 'guided-offline' ? 'WARN' : 'PASS',
      detail: diagnostic.engineMode === 'guided-offline' ? 'yes' : 'no',
    });

    results.push({
      name: 'Last AI response source',
      status: lastSource ? 'PASS' : 'WARN',
      detail: lastSource ?? 'No response generated yet in this session',
    });

    results.push({
      name: 'App Lock capability',
      status: lock.available ? 'PASS' : 'WARN',
      detail: lock.available ? `${lock.enrolledTypes.length} auth type(s)` : 'unavailable',
    });

    try {
      const dbPath = `${FileSystem.documentDirectory ?? ''}SQLite/${DATABASE_NAME}`;
      const info = await FileSystem.getInfoAsync(dbPath);
      results.push({
        name: 'Local database',
        status: info.exists ? 'PASS' : 'WARN',
        detail: info.exists ? 'SQLite file present' : 'Database not initialized yet',
      });
    } catch {
      results.push({
        name: 'Local database',
        status: 'WARN',
        detail: 'Could not inspect database path',
      });
    }

    setChecks(results);
    setBusy(false);
  }, [diagnostic.engineMode, model.status]);

  const overall: CheckStatus = checks.some((c) => c.status === 'FAIL')
    ? 'FAIL'
    : checks.some((c) => c.status === 'WARN')
      ? 'WARN'
      : checks.length > 0
        ? 'PASS'
        : 'WARN';

  return (
    <Screen title="Production readiness" scroll>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.md }}>
        Development only. Runtime checks run on-device; build-time items are verified in CI.
      </Text>

      <Card>
        <Row label="App version" value={`${APP.version}`} />
        <Row label="Model" value={LOCAL_MODEL_CONFIG.displayName} />
        <Row label="Model id" value={diagnostic.modelConfigured} />
        <Row label="AI state" value={diagnostic.title} />
        <Row label="Fallback mode" value={diagnostic.engineMode === 'guided-offline' ? 'yes' : 'no'} />
        <Row label="Device tier" value={diagnostic.deviceTier.toUpperCase()} />
        <Row label="Last response source" value={getLastAIResponseSource() ?? '—'} />
      </Card>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Run local self-check" onPress={() => void runSelfCheck()} loading={busy} />
        {checks.length > 0 ? (
          <Card>
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
              Overall: {overall}
            </Text>
            {checks.map((check) => (
              <View key={check.name} style={{ marginBottom: theme.spacing.sm }}>
                <Text variant="bodyStrong">
                  [{check.status}] {check.name}
                </Text>
                <Text variant="caption" color="textMuted">
                  {check.detail}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}
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
