/**
 * Local-only logger. Writes to an in-memory ring buffer and, in development,
 * to the console. Never sends anything off the device.
 *
 * Production builds suppress sensitive context fields and avoid logging user content.
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

const SENSITIVE_KEY_PATTERN =
  /password|secret|token|journal|mood|chat|message|conversation|crisis|voice|export|uri|path|content|prompt|reply/i;

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 80) return `[redacted string len=${value.length}]`;
    return value;
  }
  if (Array.isArray(value)) return `[array len=${value.length}]`;
  if (value && typeof value === 'object') return '[object]';
  return value;
}

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;
  if (__DEV__) return context;

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      safe[key] = '[redacted]';
    } else {
      safe[key] = redactValue(value);
    }
  }
  return safe;
}

function record(level: Level, message: string, context?: Record<string, unknown>): void {
  const safeContext = sanitizeContext(context);
  const entry: LogRecord = { level, message, context: safeContext, at: Date.now() };
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
