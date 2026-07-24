/**
 * Local offline care-retention: Care Streak, Rest Day, Daily Care, Garden, Weekly.
 * Does NOT gamify crisis interactions or chat message volume.
 */

import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';

export type CareActivityKind =
  | 'mood'
  | 'journal'
  | 'breathing'
  | 'grounding'
  | 'sleep'
  | 'selfcare'
  | 'reflection';

export interface CareStreakState {
  currentStreak: number;
  longestStreak: number;
  lastQualifyingDate: string | null;
  restDayAvailable: boolean;
  restDayUsedOn: string | null;
  showedUpToday: boolean;
}

export interface DailyCareTask {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** Navigation target hint for UI */
  action:
    | 'mood'
    | 'breathe'
    | 'journal'
    | 'ground'
    | 'sleep'
    | 'chat'
    | 'selfcare';
}

export interface GardenProgress {
  careActions: number;
  activeDays: number;
  journalEntries: number;
  calmSessions: number;
  moodCheckIns: number;
  stage: 'seed' | 'sprout' | 'leaves' | 'flower' | 'garden';
}

export interface WeeklyProgress {
  days: { date: string; label: string; active: boolean }[];
  activeCount: number;
  moodCount: number;
  journalCount: number;
  calmCount: number;
}

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + delta);
  return localDateKey(dt);
}

function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dt.getDay()] ?? '';
}

const QUALIFYING: CareActivityKind[] = [
  'mood',
  'journal',
  'breathing',
  'grounding',
  'sleep',
  'selfcare',
  'reflection',
];

/**
 * Record a meaningful wellness action. Crisis flows must never call this.
 * Same local day only increments streak once.
 */
export async function recordCareActivity(kind: CareActivityKind): Promise<CareStreakState> {
  if (!QUALIFYING.includes(kind)) {
    return getCareStreak();
  }

  const db = getDatabase();
  const today = localDateKey();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO care_activities (id, kind, local_date, created_at) VALUES (?, ?, ?, ?)`,
    [createId(), kind, today, now],
  );

  const prior = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_qualifying_date: string | null;
    rest_day_available: number;
    rest_day_used_on: string | null;
  }>(`SELECT * FROM care_streak WHERE id = 1`);

  let current = prior?.current_streak ?? 0;
  let longest = prior?.longest_streak ?? 0;
  const last = prior?.last_qualifying_date ?? null;
  let restAvailable = (prior?.rest_day_available ?? 1) === 1;
  let restUsedOn = prior?.rest_day_used_on ?? null;

  if (last === today) {
    // Already counted today — activity stored, streak unchanged.
  } else if (!last) {
    current = 1;
  } else if (last === addDays(today, -1)) {
    current += 1;
  } else if (last === addDays(today, -2) && restAvailable) {
    // Missed one day → compassionate Rest Day consumes protection, streak continues.
    current += 1;
    restAvailable = false;
    restUsedOn = addDays(today, -1);
  } else {
    // Gap without rest day — journey continues from 1; longest preserved.
    current = 1;
  }

  longest = Math.max(longest, current);

  await db.runAsync(
    `UPDATE care_streak SET current_streak = ?, longest_streak = ?, last_qualifying_date = ?,
     rest_day_available = ?, rest_day_used_on = ?, updated_at = ? WHERE id = 1`,
    [current, longest, today, restAvailable ? 1 : 0, restUsedOn, now],
  );

  // Refresh rest day weekly (Monday local).
  const dow = new Date().getDay();
  if (dow === 1 && restUsedOn && restUsedOn < today) {
    await db.runAsync(
      `UPDATE care_streak SET rest_day_available = 1, rest_day_used_on = NULL, updated_at = ? WHERE id = 1`,
      [now],
    );
    restAvailable = true;
    restUsedOn = null;
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    lastQualifyingDate: today,
    restDayAvailable: restAvailable,
    restDayUsedOn: restUsedOn,
    showedUpToday: true,
  };
}

export async function getCareStreak(): Promise<CareStreakState> {
  const db = getDatabase();
  const today = localDateKey();
  const row = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_qualifying_date: string | null;
    rest_day_available: number;
    rest_day_used_on: string | null;
  }>(`SELECT * FROM care_streak WHERE id = 1`);

  return {
    currentStreak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    lastQualifyingDate: row?.last_qualifying_date ?? null,
    restDayAvailable: (row?.rest_day_available ?? 1) === 1,
    restDayUsedOn: row?.rest_day_used_on ?? null,
    showedUpToday: row?.last_qualifying_date === today,
  };
}

/** Deterministic Daily Care path for today — no network, no remote AI. */
export function buildDailyCareTasks(now = new Date()): DailyCareTask[] {
  const hour = now.getHours();
  const seed = Number(localDateKey(now).replace(/-/g, '')) % 3;

  const checkIn: DailyCareTask = {
    id: 'check-in',
    title: 'Check in',
    subtitle: 'How are you feeling?',
    minutes: 1,
    action: 'mood',
  };

  const calm: DailyCareTask =
    hour >= 20
      ? {
          id: 'calm',
          title: 'Prepare for rest',
          subtitle: 'A short wind-down',
          minutes: 3,
          action: 'sleep',
        }
      : seed === 0
        ? {
            id: 'calm',
            title: 'Take one calm minute',
            subtitle: 'Gentle breathing',
            minutes: 1,
            action: 'breathe',
          }
        : {
            id: 'calm',
            title: 'Ground yourself',
            subtitle: '5-4-3-2-1 senses',
            minutes: 2,
            action: 'ground',
          };

  const reflect: DailyCareTask =
    seed === 2
      ? {
          id: 'reflect',
          title: 'Talk with Oppuna',
          subtitle: 'Something on your mind?',
          minutes: 2,
          action: 'chat',
        }
      : {
          id: 'reflect',
          title: 'Reflect',
          subtitle: 'A private journal note',
          minutes: 2,
          action: 'journal',
        };

  return [checkIn, calm, reflect];
}

export async function getDailyCareProgress(date = localDateKey()): Promise<{
  tasks: DailyCareTask[];
  completedIds: string[];
}> {
  const db = getDatabase();
  const tasks = buildDailyCareTasks();
  const row = await db.getFirstAsync<{ completed_json: string }>(
    `SELECT completed_json FROM daily_care_progress WHERE local_date = ?`,
    [date],
  );
  let completedIds: string[] = [];
  try {
    completedIds = row ? (JSON.parse(row.completed_json) as string[]) : [];
  } catch {
    completedIds = [];
  }
  return { tasks, completedIds };
}

export async function completeDailyCareTask(taskId: string): Promise<string[]> {
  const db = getDatabase();
  const date = localDateKey();
  const tasks = buildDailyCareTasks();
  const { completedIds } = await getDailyCareProgress(date);
  if (!completedIds.includes(taskId)) completedIds.push(taskId);

  await db.runAsync(
    `INSERT INTO daily_care_progress (local_date, tasks_json, completed_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(local_date) DO UPDATE SET completed_json = excluded.completed_json, updated_at = excluded.updated_at`,
    [date, JSON.stringify(tasks), JSON.stringify(completedIds), Date.now()],
  );

  // Completing any daily care task counts as showing up.
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    const kindMap: Record<DailyCareTask['action'], CareActivityKind> = {
      mood: 'mood',
      breathe: 'breathing',
      journal: 'journal',
      ground: 'grounding',
      sleep: 'sleep',
      chat: 'reflection',
      selfcare: 'selfcare',
    };
    await recordCareActivity(kindMap[task.action]);
  }

  return completedIds;
}

export async function getGardenProgress(): Promise<GardenProgress> {
  const db = getDatabase();
  const careActions =
    (
      await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM care_activities`)
    )?.c ?? 0;
  const activeDays =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(DISTINCT local_date) as c FROM care_activities`,
      )
    )?.c ?? 0;
  const journalEntries =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind = 'journal'`,
      )
    )?.c ?? 0;
  const calmSessions =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind IN ('breathing','grounding','sleep')`,
      )
    )?.c ?? 0;
  const moodCheckIns =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind = 'mood'`,
      )
    )?.c ?? 0;

  let stage: GardenProgress['stage'] = 'seed';
  if (careActions >= 1) stage = 'sprout';
  if (activeDays >= 7) stage = 'leaves';
  if (journalEntries >= 10 || calmSessions >= 10) stage = 'flower';
  if (moodCheckIns >= 30 || activeDays >= 21) stage = 'garden';

  return { careActions, activeDays, journalEntries, calmSessions, moodCheckIns, stage };
}

export async function getWeeklyProgress(): Promise<WeeklyProgress> {
  const db = getDatabase();
  const today = localDateKey();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM care_activities WHERE local_date = ?`,
      [date],
    );
    days.push({
      date,
      label: weekdayLabel(date),
      active: (row?.c ?? 0) > 0,
    });
  }

  const weekStart = days[0]?.date ?? today;
  const moodCount =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind = 'mood' AND local_date >= ?`,
        [weekStart],
      )
    )?.c ?? 0;
  const journalCount =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind = 'journal' AND local_date >= ?`,
        [weekStart],
      )
    )?.c ?? 0;
  const calmCount =
    (
      await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM care_activities WHERE kind IN ('breathing','grounding','sleep') AND local_date >= ?`,
        [weekStart],
      )
    )?.c ?? 0;

  return {
    days,
    activeCount: days.filter((d) => d.active).length,
    moodCount,
    journalCount,
    calmCount,
  };
}

/** Test helpers */
export const __careRetentionTestUtils = {
  localDateKey,
  addDays,
};
