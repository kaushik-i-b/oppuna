import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { BrandSplash } from '@/app/BrandSplash';
import { configureDefaultLocalLLMClient, getLocalLLMClient } from '@/ai/llmClient';
import { initializeModel } from '@/ai/modelManager';
import { initDatabase } from '@/database';
import { warmDeviceMemoryEstimate } from '@/services/deviceCapabilityService';
import { cleanupStaleExportFiles } from '@/services/dataExport';
import { syncCareReminders } from '@/services/careReminderService';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settingsStore';
import { logger } from '@/utils/logger';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Minimum time to show the animated splash so leaf motion + ambient can play. */
const MIN_SPLASH_MS = 3200;

type Status = 'loading' | 'ready' | 'error';

export function AppBootstrap({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const careRemindersEnabled = useSettingsStore((s) => s.careRemindersEnabled);
  const [status, setStatus] = useState<Status>('loading');
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const bootStartedAt = useRef(Date.now());

  const bootstrap = useCallback(async () => {
    try {
      setStatus('loading');
      bootStartedAt.current = Date.now();
      setMinTimeElapsed(false);
      configureDefaultLocalLLMClient();
      // Probe RAM before model init so tier/context/GPU knobs are accurate.
      await warmDeviceMemoryEstimate();
      await initDatabase();
      void cleanupStaleExportFiles().catch(() => undefined);

      // Model init must not block the rest of the app if it fails.
      // Kick it off, await briefly for happy path, but never crash bootstrap.
      const modelInit = initializeModel().catch((error: unknown) => {
        logger.warn('On-device model initialization failed; guided responses will be used', {
          error: String(error),
        });
      });

      // Prefer finishing DB first; model warm-up continues without blocking UI forever.
      await Promise.race([
        modelInit,
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);

      const client = getLocalLLMClient();
      if (client.warmUp) {
        // Fire-and-forget remaining warm-up — UI is already usable with fallbacks.
        void client.warmUp().catch((error: unknown) => {
          logger.warn('On-device model warm-up failed; guided responses will be used', {
            error: String(error),
          });
        });
      }
      setStatus('ready');
    } catch (error) {
      logger.error('Bootstrap failed', { error: String(error) });
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const elapsed = Date.now() - bootStartedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = setTimeout(() => setMinTimeElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, [status]);

  const canEnterApp = status === 'ready' && hydrated && minTimeElapsed;

  useEffect(() => {
    if (canEnterApp) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [canEnterApp]);

  // Re-apply local daily care reminders after hydrate (survives reboot / reinstall of schedule).
  useEffect(() => {
    if (!hydrated || !careRemindersEnabled) return;
    void syncCareReminders(true).catch((error: unknown) => {
      logger.warn('Care reminder sync failed', { error: String(error) });
    });
  }, [hydrated, careRemindersEnabled]);

  if (status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Couldn’t start Oppuna</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          We had trouble preparing your private storage. Your data is untouched.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => void bootstrap()}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!canEnterApp) {
    return <BrandSplash />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
