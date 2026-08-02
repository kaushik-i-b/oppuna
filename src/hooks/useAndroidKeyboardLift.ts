import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

import { androidKeyboardLiftPx } from '@/navigation/layoutInsets';

export interface AndroidKeyboardLiftState {
  keyboardVisible: boolean;
  /** Raw IME height from the keyboard event (0 when hidden). */
  keyboardHeight: number;
  /**
   * Bottom padding to apply on Android when edge-to-edge prevents adjustResize.
   * Always 0 on iOS (use KeyboardAvoidingView there).
   */
  androidLift: number;
}

/**
 * Shared keyboard metrics for Expo edge-to-edge Android + iOS.
 * Chat, Screen (forms), and Journal editor all use this so IME handling stays consistent.
 */
export function useAndroidKeyboardLift(): AndroidKeyboardLiftState {
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const windowHeightWhenClosedRef = useRef(windowHeight);

  useEffect(() => {
    if (!keyboardVisible) {
      windowHeightWhenClosedRef.current = windowHeight;
    }
  }, [keyboardVisible, windowHeight]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const androidLift =
    Platform.OS === 'android'
      ? androidKeyboardLiftPx({
          keyboardHeight,
          windowHeight,
          windowHeightWhenClosed: windowHeightWhenClosedRef.current,
        })
      : 0;

  return { keyboardVisible, keyboardHeight, androidLift };
}
