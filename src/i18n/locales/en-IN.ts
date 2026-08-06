import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/**
 * Indian English — natural local phrasing for India users.
 * Brand name Oppuna is never translated.
 */
export const enIN: DeepPartial<Translation> = {
  home: {
    howAreYou: 'How are you feeling today?',
    wellnessSubtitle: 'Your private daily wellness plan stays on this phone.',
    moodCheckIn: 'Mood check-in',
    talk: 'Talk it through',
    breathe: 'Breathing',
    ground: 'Grounding',
    sleep: 'Sleep wind-down',
    logMood: 'Log mood',
  },
  chat: {
    title: 'Companion',
    placeholder: 'Share what’s on your mind…',
    intro:
      'Hi — I’m here for everyday wellness support. Everything stays on your phone. What’s on your mind?',
    modelLoading: 'Preparing on-device AI…',
    modelReady: 'On-device AI ready',
    modelUnavailable:
      'Guided responses are available. On-device AI activates when the model is installed with Oppuna.',
  },
  mood: {
    title: 'How are you?',
    addNote: 'Add a note (optional)',
    tags: 'What’s it related to?',
    saved: 'Mood saved on this device',
    noData: 'Log a mood to see insights here.',
  },
  journal: {
    title: 'Journal',
    bodyPlaceholder: 'Write freely — your words stay on this phone.',
    saved: 'Entry saved privately',
    dailyPrompt: 'What happened today?',
  },
  breathing: {
    title: 'Breathing',
    completeBody: 'You gave yourself a calm moment. Notice how your body feels now.',
  },
  settings: {
    privacyHubBody:
      'Oppuna works offline. Your journal, moods, and plans stay on this device. On-device AI never sends your words to a server.',
    careRemindersDescription:
      'Morning and evening nudges on this device (about 9:00 and 20:00). Local only — no accounts or push servers.',
  },
  disclaimerScreen: {
    title: 'Please read carefully',
    agree: 'I understand — continue',
  },
  safety: {
    title: 'You are not alone',
  },
};
