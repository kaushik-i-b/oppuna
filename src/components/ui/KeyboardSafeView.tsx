import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAndroidKeyboardLift } from '@/hooks/useAndroidKeyboardLift';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** iOS KeyboardAvoidingView offset (header / status bar). Ignored on Android. */
  keyboardVerticalOffset?: number;
}

/**
 * Cross-platform keyboard-safe wrapper used by form screens and editors.
 * - iOS: KeyboardAvoidingView padding
 * - Android: dynamic IME lift when Expo edge-to-edge blocks adjustResize
 */
export function KeyboardSafeView({
  children,
  style,
  keyboardVerticalOffset = 0,
}: Props): React.ReactElement {
  const { androidLift } = useAndroidKeyboardLift();

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.flex, style, androidLift > 0 ? { paddingBottom: androidLift } : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
