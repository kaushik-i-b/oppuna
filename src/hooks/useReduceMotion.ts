import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Tracks the system Reduce Motion preference. */
export function useReduceMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setEnabled);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return enabled;
}
