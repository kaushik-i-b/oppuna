import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type {
  WellnessGoalChip,
  WellnessMoodChip,
  WellnessPlan,
  WellnessPlanActivity,
  WellnessPlanContext,
  WellnessPrefs,
} from '@/wellness/types';

interface PlanRow {
  id: string;
  date_key: string;
  title: string;
  encouragement: string;
  explanation: string;
  estimated_minutes: number;
  activities_json: string;
  completed_json: string;
  context_json: string;
  created_at: number;
}

interface PrefsRow {
  id: number;
  display_name: string;
  moods_json: string;
  goals_json: string;
  available_minutes: number;
  updated_at: number;
}

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T extends object>(raw: string, fallback: T): T {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function rowToPlan(row: PlanRow): WellnessPlan {
  return {
    id: row.id,
    dateKey: row.date_key,
    title: row.title,
    encouragement: row.encouragement,
    explanation: row.explanation,
    estimatedMinutes: row.estimated_minutes,
    activities: parseJsonArray<WellnessPlanActivity>(row.activities_json),
    completedIds: parseJsonArray<string>(row.completed_json),
    context: parseJsonObject<WellnessPlanContext>(row.context_json, {
      moods: [],
      goals: [],
      availableMinutes: 15,
      completionRate: 0,
      streak: 0,
    }),
    createdAt: row.created_at,
  };
}

export function rowToPrefs(row: PrefsRow): WellnessPrefs {
  return {
    displayName: row.display_name ?? '',
    moods: parseJsonArray<WellnessMoodChip>(row.moods_json),
    goals: parseJsonArray<WellnessGoalChip>(row.goals_json),
    availableMinutes: row.available_minutes || 15,
    updatedAt: row.updated_at,
  };
}

const EMPTY_CONTEXT: WellnessPlanContext = {
  moods: [],
  goals: [],
  availableMinutes: 15,
  completionRate: 0,
  streak: 0,
};

export const wellnessPlanRepository = {
  async getPrefs(): Promise<WellnessPrefs> {
    const db = getDatabase();
    const row = await db.getFirstAsync<PrefsRow>(`SELECT * FROM wellness_prefs WHERE id = 1`);
    if (!row) {
      return {
        displayName: '',
        moods: [],
        goals: [],
        availableMinutes: 15,
        updatedAt: 0,
      };
    }
    return rowToPrefs(row);
  },

  async savePrefs(input: {
    displayName?: string;
    moods?: WellnessMoodChip[];
    goals?: WellnessGoalChip[];
    availableMinutes?: number;
  }): Promise<WellnessPrefs> {
    const db = getDatabase();
    const current = await this.getPrefs();
    const next: WellnessPrefs = {
      displayName: input.displayName ?? current.displayName,
      moods: input.moods ?? current.moods,
      goals: input.goals ?? current.goals,
      availableMinutes: input.availableMinutes ?? current.availableMinutes,
      updatedAt: Date.now(),
    };
    await db.runAsync(
      `INSERT INTO wellness_prefs (id, display_name, moods_json, goals_json, available_minutes, updated_at)
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         display_name = excluded.display_name,
         moods_json = excluded.moods_json,
         goals_json = excluded.goals_json,
         available_minutes = excluded.available_minutes,
         updated_at = excluded.updated_at`,
      [
        next.displayName,
        JSON.stringify(next.moods),
        JSON.stringify(next.goals),
        next.availableMinutes,
        next.updatedAt,
      ],
    );
    return next;
  },

  async getByDate(dateKey: string): Promise<WellnessPlan | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<PlanRow>(
      `SELECT * FROM wellness_plans WHERE date_key = ?`,
      [dateKey],
    );
    return row ? rowToPlan(row) : null;
  },

  async getRecent(limit = 14): Promise<WellnessPlan[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<PlanRow>(
      `SELECT * FROM wellness_plans ORDER BY date_key DESC LIMIT ?`,
      [limit],
    );
    return rows.map(rowToPlan);
  },

  async upsertPlan(plan: Omit<WellnessPlan, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<WellnessPlan> {
    const db = getDatabase();
    const now = Date.now();
    const existing = await this.getByDate(plan.dateKey);
    const saved: WellnessPlan = {
      id: plan.id ?? existing?.id ?? createId(),
      dateKey: plan.dateKey,
      title: plan.title,
      encouragement: plan.encouragement,
      explanation: plan.explanation,
      estimatedMinutes: plan.estimatedMinutes,
      activities: plan.activities,
      completedIds: plan.completedIds,
      context: plan.context ?? EMPTY_CONTEXT,
      createdAt: plan.createdAt ?? existing?.createdAt ?? now,
    };

    await db.runAsync(
      `INSERT INTO wellness_plans (
         id, date_key, title, encouragement, explanation, estimated_minutes,
         activities_json, completed_json, context_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date_key) DO UPDATE SET
         title = excluded.title,
         encouragement = excluded.encouragement,
         explanation = excluded.explanation,
         estimated_minutes = excluded.estimated_minutes,
         activities_json = excluded.activities_json,
         completed_json = excluded.completed_json,
         context_json = excluded.context_json`,
      [
        saved.id,
        saved.dateKey,
        saved.title,
        saved.encouragement,
        saved.explanation,
        saved.estimatedMinutes,
        JSON.stringify(saved.activities),
        JSON.stringify(saved.completedIds),
        JSON.stringify(saved.context),
        saved.createdAt,
      ],
    );
    return saved;
  },

  async setCompletedIds(dateKey: string, completedIds: string[]): Promise<WellnessPlan | null> {
    const plan = await this.getByDate(dateKey);
    if (!plan) return null;
    return this.upsertPlan({ ...plan, completedIds });
  },
};
