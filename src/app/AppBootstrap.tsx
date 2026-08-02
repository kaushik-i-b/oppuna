import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { BrandSplash, SPLASH_DURATION_MS } from '@/app/BrandSplash';
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

/** Hold the cinematic splash for its full beat before entering the app. */
const MIN_SPLASH_MS = SPLASH_DURATION_MS;

type Status = 'loading' | 'ready' | 'error';

export function AppBootstrap({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const careRemindersEnabled = useSettingsStore((s) => s.careRemindersEnabled);
  const [status, setStatus] = useState<Status>('loading');
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const bootStartedAt = useRef(Date.now());

  const canEnterApp = status === 'ready' && hydrated && minTimeElapsed;

  const bootstrap = useCallback(async () => {
    try {
      setStatus('loading');
      bootStartedAt.current = Date.now();
      setMinTimeElapsed(false);
      configureDefaultLocalLLMClient();
      // Probe RAM before later model init so tier/context/GPU knobs are accurate.
      await warmDeviceMemoryEstimate();
      await initDatabase();
      void cleanupStaleExportFiles().catch(() => undefined);

      // Do NOT load the ~1 GB GGUF during splash. Native OOM / LMK during
      // initLlama looks like an instant crash and cannot be caught in JS.
      // Mark UI ready first; model warm-up starts after the splash exits.
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

  // Reveal BrandSplash immediately — if we wait until canEnterApp, the native
  // splash covers the animated screen (and its tagline) for the whole boot.
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  // Start on-device model only after the first real screen is allowed.
  // Guided fallback remains available if this fails or the process is constrained.
  useEffect(() => {
    if (!canEnterApp) return;
    const modelInit = initializeModel().catch((error: unknown) => {
      logger.warn('On-device model initialization failed; guided responses will be used', {
        error: String(error),
      });
    });
    void modelInit.then(() => {
      const client = getLocalLLMClient();
      if (client.warmUp) {
        void client.warmUp().catch((error: unknown) => {
          logger.warn('On-device model warm-up failed; guided responses will be used', {
            error: String(error),
          });
        });
      }
    });
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
