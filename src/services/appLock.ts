import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { logger } from '@/utils/logger';

export interface AppLockCapability {
  /** Device has biometric hardware (fingerprint, face, iris). */
  hasHardware: boolean;
  /** User has enrolled at least one biometric. */
  isEnrolled: boolean;
  /**
   * The device can authenticate the user in some way (biometric enrollment or,
   * on most devices, a device passcode/PIN/pattern fallback).
   */
  available: boolean;
  enrolledTypes: LocalAuthentication.AuthenticationType[];
}

const WEB_UNAVAILABLE: AppLockCapability = {
  hasHardware: false,
  isEnrolled: false,
  available: false,
  enrolledTypes: [],
};

/**
 * Inspects the device's local authentication capability. Used before enabling
 * app lock so we never strand the user behind a lock they can't open.
 */
export async function getAppLockCapability(): Promise<AppLockCapability> {
  // Biometrics / device credentials are native-only.
  if (Platform.OS === 'web') {
    return WEB_UNAVAILABLE;
  }

  try {
    const [hasHardware, isEnrolled, enrolledTypes, securityLevel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);

    // A non-NONE security level means the OS can challenge the user (biometric
    // or device credential), which is what we rely on for the passcode fallback.
    const available =
      isEnrolled || securityLevel !== LocalAuthentication.SecurityLevel.NONE;

    return { hasHardware, isEnrolled, available, enrolledTypes };
  } catch (error) {
    logger.warn('Could not read app lock capability', { error: String(error) });
    return { hasHardware: false, isEnrolled: false, available: false, enrolledTypes: [] };
  }
}

export interface AuthenticateOptions {
  promptMessage: string;
  cancelLabel?: string;
}

/**
 * Prompts the OS biometric / device-credential dialog. Falls back to the device
 * passcode/PIN when biometrics are unavailable so the lock is never a dead end.
 */
export async function authenticate({
  promptMessage,
  cancelLabel,
}: AuthenticateOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      // Allow the OS passcode/PIN/pattern fallback if biometrics fail or are
      // not enrolled — this keeps the lock usable on every device.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    logger.warn('App lock authentication failed', { error: String(error) });
    return false;
  }
}
