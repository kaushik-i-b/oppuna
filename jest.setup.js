/* Minimal mocks so unit tests for pure services run without native modules. */

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  createSerializable: (value) => value,
  isWorkletFunction: () => false,
  createWorkletRuntime: jest.fn(),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  executeOnUIRuntimeSync: (fn) => fn(),
  scheduleOnRN: (fn) => fn,
}));

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    createAnimatedComponent: (Component) => Component,
    call: () => undefined,
  };

  const noopEntering = {
    duration: () => noopEntering,
    delay: () => noopEntering,
    springify: () => noopEntering,
    damping: () => noopEntering,
    stiffness: () => noopEntering,
    mass: () => noopEntering,
    withInitialValues: () => noopEntering,
    build: () => () => ({ animations: {}, initialValues: {} }),
  };

  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (fn) => fn(),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedProps: (fn) => fn(),
    useAnimatedRef: () => ({ current: null }),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withDelay: (_delay, anim) => anim,
    withSequence: (...anims) => anims[anims.length - 1],
    withRepeat: (anim) => anim,
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t,
      cubic: (t) => t,
      sin: (t) => t,
      out: (fn) => fn,
      in: (fn) => fn,
      inOut: (fn) => fn,
      back: () => (t) => t,
    },
    FadeIn: noopEntering,
    FadeOut: noopEntering,
    FadeInDown: noopEntering,
    FadeInUp: noopEntering,
    FadeInLeft: noopEntering,
    FadeInRight: noopEntering,
    LinearTransition: noopEntering,
    Layout: noopEntering,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    interpolate: (value, _input, output) => output?.[0] ?? value,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    cancelAnimation: jest.fn(),
    measure: jest.fn(),
  };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-documents/',
  cacheDirectory: 'file:///mock-cache/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  readDirectoryAsync: jest.fn(async () => []),
  readAsStringAsync: jest.fn(async () => 'R0dVRg=='),
  copyAsync: jest.fn(async () => undefined),
  writeAsStringAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(async () => false),
  requestReview: jest.fn(async () => undefined),
  hasAction: jest.fn(async () => false),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
  clear: jest.fn(async () => undefined),
}));

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied' })),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => 'mock-id'),
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 2 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));
