import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { logger } from '@/utils/logger';

/** Android channel for local care reminders (no remote push). */
export const CARE_REMINDER_CHANNEL_ID = 'oppuna-care-reminders';

/** Stable ids so we can replace daily reminders cleanly. */
export const CARE_REMINDER_ID = 'oppuna-daily-care';
export const MORNING_REMINDER_ID = 'oppuna-morning-plan';
export const EVENING_REMINDER_ID = 'oppuna-evening-checkin';

/** Default local times for wellness nudges. */
export const DEFAULT_REMINDER_HOUR = 10;
export const DEFAULT_REMINDER_MINUTE = 0;
export const MORNING_REMINDER_HOUR = 9;
export const MORNING_REMINDER_MINUTE = 0;
export const EVENING_REMINDER_HOUR = 20;
export const EVENING_REMINDER_MINUTE = 0;

export interface CareReminderMessage {
  title: string;
  body: string;
}

/**
 * Soft, non-guilt retention copy. Rotates by calendar day.
 * Local only — never personalized with private journal/mood content.
 */
export const CARE_REMINDER_MESSAGES: CareReminderMessage[] = [
  {
    title: 'Ready for today’s wellness plan?',
    body: 'A few gentle minutes can help you show up for yourself.',
  },
  {
    title: 'Your plan is waiting',
    body: 'Open Oppuna when you are ready — no pressure, just a soft start.',
  },
  {
    title: 'A quiet morning check-in',
    body: 'How are you feeling? Your personalized plan can meet you there.',
  },
  {
    title: 'One kind minute',
    body: 'Oppuna is here if you want to breathe, journal, or continue your plan.',
  },
  {
    title: 'Gentle pause',
    body: 'If your mind feels busy, try one small activity from today’s plan.',
  },
  {
    title: 'Your private space',
    body: 'Everything stays on your device. Open Oppuna when you are ready.',
  },
  {
    title: 'Still here',
    body: 'No pressure — just a soft reminder that care can be small.',
  },
];

export const EVENING_REMINDER_MESSAGES: CareReminderMessage[] = [
  {
    title: 'How did today go?',
    body: 'A short evening check-in can close the day gently.',
  },
  {
    title: 'Evening wind-down',
    body: 'Notice one thing that went okay — or journal what happened today.',
  },
  {
    title: 'Before you rest',
    body: 'If you like, mark a plan activity done or log how you feel.',
  },
  {
    title: 'Soft close',
    body: 'You showed up in whatever way you could. That counts.',
  },
];

const FALLBACK_REMINDER: CareReminderMessage = {
  title: 'Ready for today’s wellness plan?',
  body: 'A few gentle minutes can help you show up for yourself.',
};

const FALLBACK_EVENING: CareReminderMessage = {
  title: 'How did today go?',
  body: 'A short evening check-in can close the day gently.',
};

function dayIndex(now: Date, length: number): number {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return ((dayOfYear % length) + length) % length;
}

export function pickCareReminderMessage(now = new Date()): CareReminderMessage {
  const index = dayIndex(now, CARE_REMINDER_MESSAGES.length);
  return CARE_REMINDER_MESSAGES[index] ?? FALLBACK_REMINDER;
}

export function pickEveningReminderMessage(now = new Date()): CareReminderMessage {
  const index = dayIndex(now, EVENING_REMINDER_MESSAGES.length);
  return EVENING_REMINDER_MESSAGES[index] ?? FALLBACK_EVENING;
}

export function areCareRemindersSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function configureHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CARE_REMINDER_CHANNEL_ID, {
    name: 'Care reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120],
    lightColor: '#3D6B5A',
    sound: undefined,
  });
}

/**
 * Asks the OS for notification permission. Does not schedule anything.
 */
export async function requestCareReminderPermission(): Promise<boolean> {
  if (!areCareRemindersSupported()) return false;
  try {
    configureHandler();
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
    return Boolean(
      next.granted || next.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    );
  } catch (error) {
    logger.warn('Care reminder permission failed', { error: String(error) });
    return false;
  }
}

/** Cancels Oppuna's scheduled local care reminders. */
export async function cancelCareReminders(): Promise<void> {
  if (!areCareRemindersSupported()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(CARE_REMINDER_ID).catch(() => undefined);
    await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID).catch(() => undefined);
    await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => undefined);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => item.identifier.startsWith('oppuna-'))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
  } catch (error) {
    logger.warn('Cancel care reminders failed', { error: String(error) });
  }
}

export interface ScheduleCareRemindersOptions {
  hour?: number;
  minute?: number;
  morningHour?: number;
  morningMinute?: number;
  eveningHour?: number;
  eveningMinute?: number;
}

async function scheduleDaily(
  identifier: string,
  message: CareReminderMessage,
  hour: number,
  minute: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: message.title,
      body: message.body,
      sound: false,
      ...(Platform.OS === 'android' ? { channelId: CARE_REMINDER_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules morning + evening local reminders. Fully on-device — no push token, no network.
 * Legacy single-id reminder is cancelled.
 */
export async function scheduleCareReminders(
  options: ScheduleCareRemindersOptions = {},
): Promise<boolean> {
  if (!areCareRemindersSupported()) return false;

  const morningHour = options.morningHour ?? options.hour ?? MORNING_REMINDER_HOUR;
  const morningMinute = options.morningMinute ?? options.minute ?? MORNING_REMINDER_MINUTE;
  const eveningHour = options.eveningHour ?? EVENING_REMINDER_HOUR;
  const eveningMinute = options.eveningMinute ?? EVENING_REMINDER_MINUTE;

  try {
    configureHandler();
    await ensureAndroidChannel();
    await cancelCareReminders();

    await scheduleDaily(
      MORNING_REMINDER_ID,
      pickCareReminderMessage(),
      morningHour,
      morningMinute,
    );
    await scheduleDaily(
      EVENING_REMINDER_ID,
      pickEveningReminderMessage(),
      eveningHour,
      eveningMinute,
    );
    logger.info('Care reminders scheduled', {
      morningHour,
      morningMinute,
      eveningHour,
      eveningMinute,
    });
    return true;
  } catch (error) {
    logger.warn('Schedule care reminders failed', { error: String(error) });
    return false;
  }
}

/**
 * Applies the user's preference: schedule when enabled, cancel when disabled.
 */
export async function syncCareReminders(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    await cancelCareReminders();
    return true;
  }
  const allowed = await requestCareReminderPermission();
  if (!allowed) {
    await cancelCareReminders();
    return false;
  }
  return scheduleCareReminders();
}
