/**
 * Google Play in-app review prompt with positive-use gating.
 *
 * Never show during onboarding, after crisis routing, after errors,
 * or immediately after a negative (awful) mood check-in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

import { breathingRepository, journalRepository, moodRepository } from '@/database';
import { trackEvent } from '@/services/analyticsService';
import { logger } from '@/utils/logger';

const STATE_KEY = 'oppuna.reviewPrompt.v1';

interface ReviewState {
  lastShownAt: string | null;
  acceptedAt: string | null;
  suppressedUntil: string | null;
  showCount: number;
}

const EMPTY: ReviewState = {
  lastShownAt: null,
  acceptedAt: null,
  suppressedUntil: null,
  showCount: 0,
};

const MIN_DAYS_BETWEEN_PROMPTS = 90;
const MIN_JOURNALS = 3;
const MIN_MOODS = 5;
const MIN_BREATHING = 2;

async function loadState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as ReviewState) };
  } catch {
    return { ...EMPTY };
  }
}

async function saveState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function daysSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - Date.parse(iso);
  return ms / 86_400_000;
}

export type ReviewEligibilityReason =
  | 'not_available'
  | 'already_accepted'
  | 'cooldown'
  | 'suppressed'
  | 'thresholds_not_met'
  | 'eligible';

export interface ReviewEligibility {
  ok: boolean;
  reason: ReviewEligibilityReason;
  journals: number;
  moods: number;
  breathing: number;
}

/**
 * Positive-use thresholds: 3 journals OR 5 mood check-ins OR
 * (2+ breathing sessions AND day-7 return already recorded separately).
 */
export async function getReviewEligibility(): Promise<ReviewEligibility> {
  const available = await StoreReview.isAvailableAsync();
  if (!available) {
    return { ok: false, reason: 'not_available', journals: 0, moods: 0, breathing: 0 };
  }

  const state = await loadState();
  if (state.acceptedAt) {
    return { ok: false, reason: 'already_accepted', journals: 0, moods: 0, breathing: 0 };
  }
  if (state.suppressedUntil && Date.parse(state.suppressedUntil) > Date.now()) {
    return { ok: false, reason: 'suppressed', journals: 0, moods: 0, breathing: 0 };
  }
  if (daysSince(state.lastShownAt) < MIN_DAYS_BETWEEN_PROMPTS) {
    return { ok: false, reason: 'cooldown', journals: 0, moods: 0, breathing: 0 };
  }

  const [journals, moods, breathing] = await Promise.all([
    journalRepository.count(),
    moodRepository.count(),
    breathingRepository.count(),
  ]);

  const met =
    journals >= MIN_JOURNALS ||
    moods >= MIN_MOODS ||
    (breathing >= MIN_BREATHING && moods >= 3);

  if (!met) {
    return { ok: false, reason: 'thresholds_not_met', journals, moods, breathing };
  }

  return { ok: true, reason: 'eligible', journals, moods, breathing };
}

/** Suppress prompts after crisis routing or similar sensitive moments (24h). */
export async function suppressReviewPrompt(hours = 24): Promise<void> {
  const state = await loadState();
  const until = new Date(Date.now() + hours * 3_600_000).toISOString();
  await saveState({ ...state, suppressedUntil: until });
}

/**
 * Attempt to show the Play in-app review dialog after a positive action.
 * Call only from safe completion paths (never crisis, never awful-mood save).
 */
export async function maybeRequestReview(trigger: string): Promise<boolean> {
  try {
    const eligibility = await getReviewEligibility();
    if (!eligibility.ok) {
      logger.info('Review prompt skipped', { trigger, reason: eligibility.reason });
      return false;
    }

    await trackEvent('review_prompt_shown', { trigger }, { once: false });
    const state = await loadState();
    await saveState({
      ...state,
      lastShownAt: new Date().toISOString(),
      showCount: state.showCount + 1,
    });

    await StoreReview.requestReview();
    // Play does not tell us if the user rated; treat a successful API call as accepted attempt.
    await trackEvent('review_prompt_accepted', { trigger }, { once: false });
    const after = await loadState();
    await saveState({ ...after, acceptedAt: after.acceptedAt ?? new Date().toISOString() });
    return true;
  } catch (error) {
    logger.warn('Review prompt failed', { error: String(error), trigger });
    return false;
  }
}

export async function clearReviewPromptState(): Promise<void> {
  await AsyncStorage.removeItem(STATE_KEY);
}
