import {
  CARE_REMINDER_MESSAGES,
  EVENING_REMINDER_MESSAGES,
  areCareRemindersSupported,
  pickCareReminderMessage,
  pickEveningReminderMessage,
} from '@/services/careReminderService';

describe('careReminderService', () => {
  it('rotates reminder copy by day of year', () => {
    const a = pickCareReminderMessage(new Date(2026, 0, 1));
    const b = pickCareReminderMessage(new Date(2026, 0, 2));
    expect(CARE_REMINDER_MESSAGES).toContainEqual(a);
    expect(CARE_REMINDER_MESSAGES).toContainEqual(b);
    expect(a).not.toEqual(b);
  });

  it('provides evening check-in copy', () => {
    const evening = pickEveningReminderMessage(new Date(2026, 0, 1));
    expect(EVENING_REMINDER_MESSAGES).toContainEqual(evening);
    expect(evening.title.toLowerCase()).toMatch(/how did today|evening|before you rest|soft close/);
  });

  it('keeps reminder copy soft and non-clinical', () => {
    for (const message of [...CARE_REMINDER_MESSAGES, ...EVENING_REMINDER_MESSAGES]) {
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.body.length).toBeGreaterThan(10);
      expect(message.body.toLowerCase()).not.toMatch(/diagnos|therapy session|must|failed streak/);
    }
  });

  it('reports platform support without throwing', () => {
    expect(typeof areCareRemindersSupported()).toBe('boolean');
  });
});
