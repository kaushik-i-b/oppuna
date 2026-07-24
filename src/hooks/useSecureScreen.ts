import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

interface OppunaSecureScreenModule {
  setSecure: (enabled: boolean) => void;
}

function getModule(): OppunaSecureScreenModule | null {
  return (NativeModules.OppunaSecureScreen as OppunaSecureScreenModule | undefined) ?? null;
}

/**
 * Prevents screenshots / screen recording on sensitive surfaces (Android FLAG_SECURE).
 * No-op on web and iOS until a platform equivalent is added.
 */
export function useSecureScreen(enabled: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const mod = getModule();
    if (!mod?.setSecure) return undefined;
    mod.setSecure(enabled);
    return () => {
      mod.setSecure(false);
    };
  }, [enabled]);
}
