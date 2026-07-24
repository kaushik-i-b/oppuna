import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import { authenticate } from '@/services/appLock';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Gates the whole app behind a biometric / device-credential prompt when the
 * user has enabled App Lock. Locks on launch and whenever the app returns from
 * the background, so private content is never visible without authentication.
 */
export function AppLockGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);

  useSecureScreen(appLockEnabled);

  const [locked, setLocked] = useState(appLockEnabled);
  const [authenticating, setAuthenticating] = useState(false);
  const promptInFlight = useRef(false);

  const runAuth = useCallback(async () => {
    if (promptInFlight.current) return;
    promptInFlight.current = true;
    setAuthenticating(true);
    const success = await authenticate({
      promptMessage: t('lock.prompt'),
      cancelLabel: t('common.cancel'),
    });
    if (success) setLocked(false);
    setAuthenticating(false);
    promptInFlight.current = false;
  }, [t]);

  // When the user toggles app lock on, immediately require authentication.
  useEffect(() => {
    if (!appLockEnabled) {
      setLocked(false);
      return;
    }
    setLocked(true);
  }, [appLockEnabled]);

  // Prompt automatically whenever we enter the locked state.
  useEffect(() => {
    if (appLockEnabled && locked) {
      void runAuth();
    }
  }, [appLockEnabled, locked, runAuth]);

  // Re-lock when the app is backgrounded so resuming requires auth again.
  useEffect(() => {
    if (!appLockEnabled) return undefined;
    const onChange = (state: AppStateStatus): void => {
      if (state === 'background' || state === 'inactive') {
        setLocked(true);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [appLockEnabled]);

  if (appLockEnabled && locked) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="display">🔒</Text>
        <Text variant="title" center style={{ marginTop: theme.spacing.md }}>
          {t('lock.title')}
        </Text>
        <Text
          variant="body"
          color="textMuted"
          center
          style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }}
        >
          {t('lock.subtitle')}
        </Text>
        <Button
          label={authenticating ? t('lock.unlocking') : t('lock.unlock')}
          onPress={() => void runAuth()}
          disabled={authenticating}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
