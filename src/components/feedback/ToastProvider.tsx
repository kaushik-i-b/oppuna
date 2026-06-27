import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: theme.duration.fast,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity, theme.duration.fast]);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, variant });
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(hide, 2600);
    },
    [opacity, theme.duration.normal, hide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const background =
    toast?.variant === 'success'
      ? theme.colors.success
      : toast?.variant === 'error'
        ? theme.colors.danger
        : theme.colors.surfaceAlt;
  const textColor =
    toast?.variant === 'info' ? theme.colors.text : theme.colors.onPrimary;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrapper,
            { bottom: insets.bottom + theme.spacing.xl, opacity },
          ]}
        >
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              styles.toast,
              {
                backgroundColor: background,
                borderRadius: theme.radius.lg,
                ...theme.shadow,
              },
            ]}
          >
            <Text style={[styles.text, { color: textColor }]}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: 420,
  },
  text: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
