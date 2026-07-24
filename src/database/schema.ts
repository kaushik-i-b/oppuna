import type { SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/utils/logger';

export const DATABASE_NAME = 'oppuna.db';

/**
 * Ordered migrations. Each migration takes the schema from version `index` to
 * `index + 1`. To evolve the schema, append a new migration — never edit an
 * existing one.
 */
const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id TEXT PRIMARY KEY NOT NULL,
        mood TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        note TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_mood_created ON mood_entries (created_at);

      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries (created_at);

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        intent TEXT,
        mood TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id, created_at);

      CREATE TABLE IF NOT EXISTS breathing_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        pattern TEXT NOT NULL,
        cycles INTEGER NOT NULL DEFAULT 0,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_breathing_created ON breathing_sessions (created_at);

      CREATE TABLE IF NOT EXISTS safety_events (
        id TEXT PRIMARY KEY NOT NULL,
        category TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY NOT NULL,
        uri TEXT NOT NULL,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        transcript TEXT,
        created_at INTEGER NOT NULL
      );
    `);
  },
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS care_activities (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        local_date TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_care_activities_date ON care_activities (local_date);
      CREATE INDEX IF NOT EXISTS idx_care_activities_kind ON care_activities (kind, local_date);

      CREATE TABLE IF NOT EXISTS care_streak (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_qualifying_date TEXT,
        rest_day_available INTEGER NOT NULL DEFAULT 1,
        rest_day_used_on TEXT,
        updated_at INTEGER NOT NULL
      );
      INSERT OR IGNORE INTO care_streak (id, current_streak, longest_streak, updated_at)
        VALUES (1, 0, 0, 0);

      CREATE TABLE IF NOT EXISTS daily_care_progress (
        local_date TEXT PRIMARY KEY NOT NULL,
        tasks_json TEXT NOT NULL DEFAULT '[]',
        completed_json TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL
      );
    `);
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;

  if (version >= MIGRATIONS.length) {
    logger.info('Database schema up to date', { version });
    return;
  }

  for (let i = version; i < MIGRATIONS.length; i += 1) {
    const migrate = MIGRATIONS[i];
    if (!migrate) continue;
    await migrate(db);
    version = i + 1;
    // user_version cannot be parameterised, but `version` is an internal integer.
    await db.execAsync(`PRAGMA user_version = ${version};`);
    logger.info('Applied database migration', { to: version });
  }
}
