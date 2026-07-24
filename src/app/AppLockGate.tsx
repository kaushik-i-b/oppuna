import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { Icon } from '@/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { authenticate } from '@/services/appLock';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Gates the whole app behind a biometric / device-credential prompt when the
 * user has enabled App Lock. Locks on launch and whenever the app returns from
 * the background, so private content is never visible without authentication.
 *
 * No-ops on web — biometrics are native-only.
 */
export function AppLockGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const lockActive = Platform.OS !== 'web' && appLockEnabled;

  useSecureScreen(lockActive);

  const [locked, setLocked] = useState(lockActive);
  const [authenticating, setAuthenticating] = useState(false);
  const promptInFlight = useRef(false);

  const runAuth = useCallback(async () => {
    if (Platform.OS === 'web') return;
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
    if (!lockActive) {
      setLocked(false);
      return;
    }
    setLocked(true);
  }, [lockActive]);

  // Prompt automatically whenever we enter the locked state.
  useEffect(() => {
    if (lockActive && locked) {
      void runAuth();
    }
  }, [lockActive, locked, runAuth]);

  // Re-lock when the app is backgrounded so resuming requires auth again.
  useEffect(() => {
    if (!lockActive) return undefined;
    const onChange = (state: AppStateStatus): void => {
      if (state === 'background' || state === 'inactive') {
        setLocked(true);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [lockActive]);

  if (lockActive && locked) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Icon name="lock" size={56} color={theme.colors.primary} />
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
