import {
  ANDROID_GESTURE_NAV_MIN_BOTTOM,
  TAB_BAR_BASE_HEIGHT,
  androidKeyboardLiftPx,
  chatComposerBottomPadding,
  resolveTabBarBottomInset,
  tabBarPaddingBottom,
  tabBarTotalHeight,
} from '@/navigation/layoutInsets';

describe('tab bar safe-area layout', () => {
  it('includes system bottom inset in total height', () => {
    expect(tabBarTotalHeight(0)).toBe(TAB_BAR_BASE_HEIGHT);
    expect(tabBarTotalHeight(34)).toBe(TAB_BAR_BASE_HEIGHT + 34);
  });

  it('uses insets for paddingBottom and never goes negative', () => {
    expect(tabBarPaddingBottom(0)).toBe(0);
    expect(tabBarPaddingBottom(24)).toBe(24);
    expect(tabBarPaddingBottom(-1)).toBe(0);
  });
});

describe('resolveTabBarBottomInset (Samsung gesture nav)', () => {
  it('keeps a minimum Android pad when the system nav hint is hidden (inset 0)', () => {
    expect(resolveTabBarBottomInset(0, 'android')).toBe(ANDROID_GESTURE_NAV_MIN_BOTTOM);
  });

  it('keeps a minimum Android pad when inset is smaller than the gesture zone', () => {
    expect(resolveTabBarBottomInset(8, 'android')).toBe(ANDROID_GESTURE_NAV_MIN_BOTTOM);
  });

  it('respects larger Android insets (3-button / visible gesture bar)', () => {
    expect(resolveTabBarBottomInset(34, 'android')).toBe(34);
  });

  it('does not force a minimum pad on iOS', () => {
    expect(resolveTabBarBottomInset(0, 'ios')).toBe(0);
    expect(resolveTabBarBottomInset(34, 'ios')).toBe(34);
  });
});

describe('chat composer keyboard padding', () => {
  it('uses only min padding while the keyboard is open (adjustResize path)', () => {
    expect(chatComposerBottomPadding(true, 34, 8)).toBe(8);
    expect(chatComposerBottomPadding(true, 0, 8)).toBe(8);
  });

  it('does not double-apply bottom inset when the tab bar already consumes it', () => {
    expect(chatComposerBottomPadding(false, 34, 8, true)).toBe(8);
    expect(chatComposerBottomPadding(false, 0, 8, true)).toBe(8);
  });

  it('applies system inset when Chat is full-screen without a tab bar', () => {
    expect(chatComposerBottomPadding(false, 34, 8, false)).toBe(34);
    expect(chatComposerBottomPadding(false, 4, 8, false)).toBe(8);
  });

  it('does not apply hardcoded Android IME lift offsets', () => {
    // Regression guard: previous ChatScreen used a fixed +24dp lift on Android.
    const HARDCODED_LIFT = 24;
    expect(chatComposerBottomPadding(true, 34, 8)).not.toBe(8 + HARDCODED_LIFT);
  });
});

describe('androidKeyboardLiftPx', () => {
  it('returns 0 when adjustResize already shrank the window', () => {
    expect(
      androidKeyboardLiftPx({
        keyboardHeight: 420,
        windowHeight: 400,
        windowHeightWhenClosed: 900,
      }),
    ).toBe(0);
  });

  it('lifts by reported IME height when the window did not resize (edge-to-edge)', () => {
    expect(
      androidKeyboardLiftPx({
        keyboardHeight: 420,
        windowHeight: 900,
        windowHeightWhenClosed: 900,
      }),
    ).toBe(420);
  });

  it('returns 0 when the keyboard is hidden', () => {
    expect(
      androidKeyboardLiftPx({
        keyboardHeight: 0,
        windowHeight: 900,
        windowHeightWhenClosed: 900,
      }),
    ).toBe(0);
  });
});
