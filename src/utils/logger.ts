/**
 * Local-only logger. It writes to the in-memory ring buffer and, in dev, to the
 * console. It never sends anything off the device — there is no remote sink.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogRecord {
  level: Level;
  message: string;
  context?: Record<string, unknown>;
  at: number;
}

const RING_SIZE = 200;
const ring: LogRecord[] = [];

function record(level: Level, message: string, context?: Record<string, unknown>): void {
  const entry: LogRecord = { level, message, context, at: Date.now() };
  ring.push(entry);
  if (ring.length > RING_SIZE) ring.shift();

  if (__DEV__) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : console.log;
    fn(`[oppuna:${level}] ${message}`, context ?? '');
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => record('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => record('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => record('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => record('error', message, context),
  /** Returns a copy of recent log records (for the diagnostics view). */
  snapshot: (): LogRecord[] => [...ring],
};
