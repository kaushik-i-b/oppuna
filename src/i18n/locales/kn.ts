import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Kannada translations. Missing keys fall back to English automatically. */
export const kn: DeepPartial<Translation> = {
  common: {
    save: "ಉಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    delete: "ಅಳಿಸಿ",
    edit: "ಸಂಪಾದಿಸಿ",
    done: "ಮುಗಿದಿದೆ",
    close: "ಮುಚ್ಚಿ",
    back: "ಹಿಂದೆ",
    continue: "ಮುಂದುವರಿಸಿ",
    confirm: "ದೃಢೀಕರಿಸಿ",
    search: "ಹುಡುಕಿ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    optional: "ಐಚ್ಛಿಕ",
    empty: "ಇನ್ನೂ ಏನೂ ಇಲ್ಲ"
  },
  tabs: {
    home: "ಮುಖಪುಟ",
    chat: "ಚಾಟ್",
    mood: "ಮನಸ್ಥಿತಿ",
    journal: "ಜರ್ನಲ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು"
  },
  home: {
    greetingMorning: "ಶುಭೋದಯ",
    greetingAfternoon: "ನಮಸ್ಕಾರ",
    greetingEvening: "ಶುಭ ಸಂಜೆ",
    howAreYou: "ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ?",
    quickActions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
    talk: "ಮಾತನಾಡಿ",
    breathe: "ಉಸಿರಾಡಿ",
    ground: "ಗ್ರೌಂಡಿಂಗ್",
    sleep: "ನಿದ್ರೆ ಬೆಂಬಲ",
    selfCare: "ಸ್ವಯಂ ಆರೈಕೆ",
    insights: "ಒಳನೋಟಗಳು",
    logMood: "ಮನಸ್ಥಿತಿ ದಾಖಲಿಸಿ"
  },
  chat: {
    title: "ಸಂಗಾತಿ",
    placeholder: "ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿರುವುದನ್ನು ಹಂಚಿಕೊಳ್ಳಿ…",
    clear: "ಸಂಭಾಷಣೆ ಅಳಿಸಿ",
    cleared: "ಸಂಭಾಷಣೆ ಅಳಿಸಲಾಗಿದೆ",
    kannadaComingSoon: "ಕನ್ನಡ AI ಚಾಟ್ ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗಲಿದೆ. ಸದ್ಯಕ್ಕೆ ಮಾರ್ಗದರ್ಶಿ ಬೆಂಬಲದೊಂದಿಗೆ ಮಾತನಾಡಬಹುದು."
  },
  settings: {
    title: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    language: "ಭಾಷೆ",
    appearance: "ಗೋಚರತೆ",
    theme: "ಪ್ರಕಾಶ",
    about: "Oppuna ಬಗ್ಗೆ"
  },
  safety: {
    title: "ನಿಮಗೆ ಈಗ ಬೆಂಬಲ ಬೇಕು",
    emergency: "ನೀವು ತಕ್ಷಣ ಅಪಾಯದಲ್ಲಿದ್ದರೆ, ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    breathe: "ನಿಧಾನವಾಗಿ ಉಸಿರಾಡಿ",
    backToSafety: "ನಾನು ಈಗ ಸುರಕ್ಷಿತನಿದ್ದೇನೆ",
    callEmergency: "ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ"
  }
};
