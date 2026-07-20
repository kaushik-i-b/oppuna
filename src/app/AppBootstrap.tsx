import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { BrandSplash } from '@/app/BrandSplash';
import { configureDefaultLocalLLMClient, getLocalLLMClient } from '@/ai/llmClient';
import { initializeModelManager } from '@/ai/modelManager';
import { provisionBundledModel } from '@/ai/modelProvisioning';
import { initDatabase } from '@/database';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settingsStore';
import { logger } from '@/utils/logger';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type Status = 'loading' | 'ready' | 'error';

export function AppBootstrap({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const [status, setStatus] = useState<Status>('loading');

  const bootstrap = useCallback(async () => {
    try {
      setStatus('loading');
      configureDefaultLocalLLMClient();
      await initDatabase();
      // Stage a bundled GGUF model into local storage (offline, one-time) so
      // the on-device mental-health agent can load it, then scan for models.
      await provisionBundledModel();
      await initializeModelManager();
      const client = getLocalLLMClient();
      if (client.warmUp) {
        await client.warmUp().catch((error: unknown) => {
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
    if (status === 'ready' && hydrated) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status, hydrated]);

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

  if (status !== 'ready' || !hydrated) {
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
