import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, runMigrations } from '@/database/schema';
import { logger } from '@/utils/logger';

let instance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens the database (once) and runs pending migrations. */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await runMigrations(db);
    instance = db;
    logger.info('Database ready');
    return db;
  })();

  return initPromise;
}

/** Returns the initialised database, throwing if init has not completed. */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!instance) {
    throw new Error('Database accessed before initialisation. Call initDatabase() first.');
  }
  return instance;
}

/** Drops all rows from every table — used by the "Delete all data" feature. */
export async function wipeAllTables(): Promise<void> {
  const db = getDatabase();
  await db.execAsync(`
    DELETE FROM chat_messages;
    DELETE FROM chat_sessions;
    DELETE FROM mood_entries;
    DELETE FROM journal_entries;
    DELETE FROM breathing_sessions;
    DELETE FROM safety_events;
    DELETE FROM voice_notes;
    DELETE FROM care_activities;
    DELETE FROM care_streak;
    DELETE FROM daily_care_progress;
    INSERT OR IGNORE INTO care_streak (id, current_streak, longest_streak, updated_at)
      VALUES (1, 0, 0, 0);
    VACUUM;
  `);
  logger.info('All local tables wiped');
}
