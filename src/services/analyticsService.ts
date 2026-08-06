/**
 * Privacy-respecting local analytics for install-conversion funnels.
 *
 * - Events stay on-device (AsyncStorage). Nothing is uploaded.
 * - Never attach journal body, mood notes, chat text, or free-form content.
 * - Safe property values: booleans, small enums, counts, ISO dates only.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@/utils/logger';

const STORAGE_KEY = 'oppuna.analytics.v1';
const MAX_EVENTS = 500;

/** Allowed funnel event names (Play ASO / activation). */
export type AnalyticsEventName =
  | 'first_open'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_mood_logged'
  | 'first_journal_created'
  | 'breathing_started'
  | 'ai_reflection_started'
  | 'day_2_return'
  | 'day_7_return'
  | 'premium_screen_viewed'
  | 'premium_trial_started'
  | 'review_prompt_shown'
  | 'review_prompt_accepted';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  ts: string;
  props?: AnalyticsProps;
}

interface AnalyticsState {
  firstOpenAt: string | null;
  events: AnalyticsEvent[];
  flags: Partial<Record<AnalyticsEventName, boolean>>;
  /** Calendar day keys (YYYY-MM-DD) when the app was opened after install. */
  openDays: string[];
}

const EMPTY: AnalyticsState = {
  firstOpenAt: null,
  events: [],
  flags: {},
  openDays: [],
};

let memory: AnalyticsState | null = null;
let loadPromise: Promise<AnalyticsState> | null = null;

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso.slice(0, 10));
  const b = Date.parse(bIso.slice(0, 10));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.floor((b - a) / 86_400_000);
}

/** Strip any accidental free-text / large payloads. */
function sanitizeProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.toLowerCase().includes('note') || key.toLowerCase().includes('body')) continue;
    if (key.toLowerCase().includes('text') || key.toLowerCase().includes('content')) continue;
    if (typeof value === 'string' && value.length > 48) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

async function load(): Promise<AnalyticsState> {
  if (memory) return memory;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        memory = { ...EMPTY, events: [], flags: {}, openDays: [] };
        return memory;
      }
      const parsed = JSON.parse(raw) as AnalyticsState;
      memory = {
        firstOpenAt: parsed.firstOpenAt ?? null,
        events: Array.isArray(parsed.events) ? parsed.events : [],
        flags: parsed.flags ?? {},
        openDays: Array.isArray(parsed.openDays) ? parsed.openDays : [],
      };
      return memory;
    } catch (error) {
      logger.warn('Analytics load failed', { error: String(error) });
      memory = { ...EMPTY, events: [], flags: {}, openDays: [] };
      return memory;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

async function persist(state: AnalyticsState): Promise<void> {
  memory = state;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.warn('Analytics persist failed', { error: String(error) });
  }
}

/**
 * Record a funnel event locally. Once-only events use `once: true`.
 */
export async function trackEvent(
  name: AnalyticsEventName,
  props?: AnalyticsProps,
  options?: { once?: boolean },
): Promise<void> {
  const state = await load();
  if (options?.once && state.flags[name]) return;

  const event: AnalyticsEvent = {
    name,
    ts: new Date().toISOString(),
    props: sanitizeProps(props),
  };

  const events = [...state.events, event].slice(-MAX_EVENTS);
  const flags = options?.once ? { ...state.flags, [name]: true } : state.flags;

  await persist({ ...state, events, flags });
  logger.info('analytics', { name, once: Boolean(options?.once) });
}

/** Call on every cold start after DB/settings hydrate. */
export async function recordAppOpen(): Promise<void> {
  const state = await load();
  const today = dayKey();
  const openDays = state.openDays.includes(today)
    ? state.openDays
    : [...state.openDays, today].slice(-60);

  let firstOpenAt = state.firstOpenAt;
  if (!firstOpenAt) {
    firstOpenAt = new Date().toISOString();
    await persist({ ...state, firstOpenAt, openDays });
    await trackEvent('first_open', { day: today }, { once: true });
    return;
  }

  await persist({ ...state, firstOpenAt, openDays });

  const elapsed = daysBetween(firstOpenAt, today);
  if (elapsed >= 2) {
    await trackEvent('day_2_return', { day: today, days_since_install: elapsed }, { once: true });
  }
  if (elapsed >= 7) {
    await trackEvent('day_7_return', { day: today, days_since_install: elapsed }, { once: true });
  }
}

export async function hasFlag(name: AnalyticsEventName): Promise<boolean> {
  const state = await load();
  return Boolean(state.flags[name]);
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsState> {
  return load();
}

/** Used by data delete / reset. */
export async function clearAnalytics(): Promise<void> {
  memory = { ...EMPTY, events: [], flags: {}, openDays: [] };
  await AsyncStorage.removeItem(STORAGE_KEY);
}
