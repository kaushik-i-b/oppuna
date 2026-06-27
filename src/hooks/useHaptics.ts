import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Thin, safe wrapper around expo-haptics. Haptics are best-effort: on web or
 * unsupported devices the calls quietly no-op.
 */
export function useHaptics() {
  const supported = Platform.OS === 'ios' || Platform.OS === 'android';

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (!supported) return;
      Haptics.impactAsync(style).catch(() => undefined);
    },
    [supported],
  );

  const notify = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (!supported) return;
      Haptics.notificationAsync(type).catch(() => undefined);
    },
    [supported],
  );

  const selection = useCallback(() => {
    if (!supported) return;
    Haptics.selectionAsync().catch(() => undefined);
  }, [supported]);

  return { impact, notify, selection };
}
