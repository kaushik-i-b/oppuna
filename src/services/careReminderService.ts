import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { logger } from '@/utils/logger';

/** Android channel for local care reminders (no remote push). */
export const CARE_REMINDER_CHANNEL_ID = 'oppuna-care-reminders';

/** Stable id so we can replace the daily reminder cleanly. */
export const CARE_REMINDER_ID = 'oppuna-daily-care';

/** Default local time for the daily check-in nudge. */
export const DEFAULT_REMINDER_HOUR = 10;
export const DEFAULT_REMINDER_MINUTE = 0;

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
    title: 'A quiet check-in',
    body: 'How are you feeling today? A 20-second mood note can help.',
  },
  {
    title: 'One kind minute',
    body: 'Oppuna is here if you want to breathe, journal, or talk things through.',
  },
  {
    title: 'Notice today',
    body: 'A small Care Streak starts with showing up for yourself — even briefly.',
  },
  {
    title: 'Gentle pause',
    body: 'If your mind feels busy, try a short breath or grounding exercise.',
  },
  {
    title: 'Your private space',
    body: 'Everything stays on your device. Open Oppuna when you are ready.',
  },
  {
    title: 'Thoughts and feelings',
    body: 'Naming what is on your mind can soften it. Want to write a few lines?',
  },
  {
    title: 'Still here',
    body: 'No pressure — just a soft reminder that care can be small.',
  },
];

const FALLBACK_REMINDER: CareReminderMessage = {
  title: 'A quiet check-in',
  body: 'How are you feeling today? A 20-second mood note can help.',
};

export function pickCareReminderMessage(now = new Date()): CareReminderMessage {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const index = ((dayOfYear % CARE_REMINDER_MESSAGES.length) + CARE_REMINDER_MESSAGES.length) %
    CARE_REMINDER_MESSAGES.length;
  return CARE_REMINDER_MESSAGES[index] ?? FALLBACK_REMINDER;
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
    // Safety: clear any legacy identifiers from earlier builds.
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
}

/**
 * Schedules a repeating local daily reminder. Fully on-device — no push token, no network.
 */
export async function scheduleCareReminders(
  options: ScheduleCareRemindersOptions = {},
): Promise<boolean> {
  if (!areCareRemindersSupported()) return false;

  const hour = options.hour ?? DEFAULT_REMINDER_HOUR;
  const minute = options.minute ?? DEFAULT_REMINDER_MINUTE;
  const message = pickCareReminderMessage();

  try {
    configureHandler();
    await ensureAndroidChannel();
    await cancelCareReminders();

    await Notifications.scheduleNotificationAsync({
      identifier: CARE_REMINDER_ID,
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
    logger.info('Care reminders scheduled', { hour, minute });
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
