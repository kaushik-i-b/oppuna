/**
 * Pure layout helpers for Chat / tab bar safe-area + keyboard behavior.
 * Kept free of React so unit tests can lock the P0 contracts.
 */

/** Base tab bar content height (icons + label), before system inset. */
export const TAB_BAR_BASE_HEIGHT = 56;

/**
 * When Samsung (and similar) gesture nav hides the bottom indicator,
 * `insets.bottom` often drops to 0. Tab icons then sit inside the system
 * home-gesture zone and taps are swallowed. Keep a minimum pad on Android.
 */
export const ANDROID_GESTURE_NAV_MIN_BOTTOM = 20;

/**
 * Resolve the bottom inset used for tab bar height / padding.
 * iOS: trust safe-area insets. Android: never go below the gesture min pad.
 */
export function resolveTabBarBottomInset(
  insetsBottom: number,
  platform: string,
): number {
  const inset = Math.max(0, insetsBottom);
  if (platform === 'android') {
    return Math.max(inset, ANDROID_GESTURE_NAV_MIN_BOTTOM);
  }
  return inset;
}

export function tabBarTotalHeight(bottomInset: number): number {
  return TAB_BAR_BASE_HEIGHT + Math.max(0, bottomInset);
}

export function tabBarPaddingBottom(bottomInset: number): number {
  return Math.max(0, bottomInset);
}

/**
 * Composer bottom padding for Chat embedded in bottom tabs.
 *
 * - Keyboard open: small gap only (IME lift is applied on the chat column).
 * - Keyboard closed: tab bar already includes insets.bottom — only min padding.
 * - Full-screen (no tab bar): pass tabBarConsumesBottomInset=false to apply inset.
 */
export function chatComposerBottomPadding(
  keyboardVisible: boolean,
  insetsBottom: number,
  minPadding: number,
  tabBarConsumesBottomInset = true,
): number {
  if (keyboardVisible) return minPadding;
  if (tabBarConsumesBottomInset) return minPadding;
  return Math.max(0, insetsBottom, minPadding);
}

/**
 * Android IME lift for Expo edge-to-edge.
 *
 * Prefer `softwareKeyboardLayoutMode: resize`. When the window already shrank
 * (classic adjustResize), return 0 to avoid double-padding. When edge-to-edge
 * leaves the JS window full-height, lift by the reported keyboard height.
 * Never use a hardcoded OEM offset.
 */
export function androidKeyboardLiftPx(options: {
  keyboardHeight: number;
  windowHeight: number;
  windowHeightWhenClosed: number;
  /** Minimum shrink (dp) that counts as a successful adjustResize. */
  resizeThreshold?: number;
}): number {
  const { keyboardHeight, windowHeight, windowHeightWhenClosed } = options;
  const threshold = options.resizeThreshold ?? 80;
  if (keyboardHeight <= 0) return 0;
  const shrunk = windowHeightWhenClosed - windowHeight;
  if (shrunk >= threshold) return 0;
  return Math.max(0, Math.round(keyboardHeight));
}
