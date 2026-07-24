/**
 * Care streak / daily care / rest day unit tests (pure + service rules).
 * Uses the exported test utils; DB-backed tests mock getDatabase.
 */

import {
  buildDailyCareTasks,
  __careRetentionTestUtils as utils,
} from '@/services/careRetentionService';

describe('careRetention date helpers', () => {
  it('formats local date keys as YYYY-MM-DD', () => {
    const key = utils.localDateKey(new Date('2026-07-25T15:00:00'));
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDays moves calendar days', () => {
    expect(utils.addDays('2026-07-25', -1)).toBe('2026-07-24');
    expect(utils.addDays('2026-07-25', 1)).toBe('2026-07-26');
  });
});

describe('buildDailyCareTasks', () => {
  it('returns three deterministic local tasks with no network', () => {
    const morning = buildDailyCareTasks(new Date('2026-07-25T09:00:00'));
    expect(morning).toHaveLength(3);
    expect(morning[0]?.id).toBe('check-in');
    expect(morning.every((t) => t.title && t.action)).toBe(true);
  });

  it('prefers sleep-oriented calm task in the evening', () => {
    const evening = buildDailyCareTasks(new Date('2026-07-25T21:30:00'));
    expect(evening[1]?.action).toBe('sleep');
  });
});
