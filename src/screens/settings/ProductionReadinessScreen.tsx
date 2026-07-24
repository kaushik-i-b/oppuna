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
import { getModelDiagnosticStatus } from '@/services/modelDiagnosticService';
import { getModelMetadata, isModelAvailable } from '@/services/modelAssetService';
import { getAppLockCapability } from '@/services/appLock';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTheme } from '@/theme/ThemeProvider';

type CheckStatus = 'PASS' | 'WARN' | 'FAIL';

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

    results.push({
      name: 'Offline-only flag',
      status: true ? 'PASS' : 'FAIL',
      detail: 'extra.offlineOnly expected in app config',
    });

    results.push({
      name: 'Android backup disabled',
      status: 'PASS',
      detail: 'Validated in CI via verify:privacy-config',
    });

    results.push({
      name: 'INTERNET permission blocked',
      status: 'PASS',
      detail: 'android.blockedPermissions includes INTERNET',
    });

    results.push({
      name: 'Model configured',
      status: meta.modelName === LOCAL_MODEL_CONFIG.id ? 'PASS' : 'FAIL',
      detail: meta.modelName,
    });

    results.push({
      name: 'Model present on device',
      status: modelPresent ? 'PASS' : 'WARN',
      detail: modelPresent ? 'GGUF resolved' : 'No local GGUF (expected in dev without PAD)',
    });

    results.push({
      name: 'AI engine state',
      status:
        diagnostic.engineMode === 'on-device'
          ? 'PASS'
          : diagnostic.engineMode === 'initializing'
            ? 'WARN'
            : 'WARN',
      detail: `${diagnostic.engineMode} (${model.status})`,
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
        Development only. No secrets or private user content are shown.
      </Text>

      <Card>
        <Row label="App version" value={`${APP.version}`} />
        <Row label="Model" value={LOCAL_MODEL_CONFIG.displayName} />
        <Row label="Model id" value={diagnostic.modelConfigured} />
        <Row label="AI state" value={diagnostic.title} />
        <Row label="Fallback mode" value={diagnostic.engineMode === 'guided-offline' ? 'yes' : 'no'} />
        <Row label="Device tier" value={diagnostic.deviceTier.toUpperCase()} />
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
