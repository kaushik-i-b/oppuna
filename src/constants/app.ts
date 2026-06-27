export const APP = {
  name: 'Oppuna',
  tagline: 'Private mental wellness support, offline on your phone.',
  version: '1.0.0',
} as const;

export const MEDICAL_DISCLAIMER =
  'Oppuna is not a doctor, therapist, crisis service, or medical device. ' +
  'It does not diagnose, treat, cure, prevent, or replace professional care. ' +
  'It provides supportive wellness guidance only. If you are in danger or need ' +
  'medical help, contact your local emergency services right away.';

export const PRIVACY_STATEMENT =
  'Everything you write, record, and track in Oppuna stays on this device. ' +
  'There is no account, no cloud sync, no analytics, and no tracking. ' +
  'Oppuna works fully in airplane mode and never sends your data anywhere. ' +
  'You can export a copy of your data or delete all of it at any time from Settings.';

/** Secure-store keys (never store sensitive content here, only flags/preferences). */
export const SECURE_KEYS = {
  appLockEnabled: 'oppuna.appLock.enabled',
} as const;
