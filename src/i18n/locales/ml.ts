import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Malayalam translations. Missing keys fall back to English automatically. */
export const ml: DeepPartial<Translation> = {
  common: {
    save: "സംരക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    delete: "മായ്ക്കുക",
    edit: "എഡിറ്ട്",
    done: "കഴിഞ്ഞു",
    close: "അടയ്ക്കുക",
    back: "തിരികെ",
    continue: "തുടരുക",
    confirm: "സ്ഥിരീകരിക്കുക",
    search: "തിരയുക",
    loading: "ലോഡ് ചെയ്യുന്നു…",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    optional: "ഓപ്ഷണൽ",
    empty: "ഇവിടെ ഇതുവരെ ഒന്നുമില്ല"
  },
  tabs: {
    home: "ഹോം",
    chat: "ചാറ്റ്",
    mood: "മനോഭാവം",
    journal: "ജേണൽ",
    settings: "ക്രമീകരണങ്ങൾ"
  },
  home: {
    greetingMorning: "സുപ്രഭാതം",
    greetingAfternoon: "നമസ്കാരം",
    greetingEvening: "ശുഭ സന്ധ്യ",
    howAreYou: "ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്?",
    quickActions: "പെട്ടെന്നുള്ള പ്രവൃത്തികൾ",
    talk: "സംസാരിക്കുക",
    breathe: "ശ്വാസം",
    ground: "ഗ്രൗണ്ടിംഗ്",
    sleep: "ഉറക്ക പിന്തുണ",
    selfCare: "സ്വയം പരിചരണം",
    insights: "അവലോകനം",
    logMood: "മനോഭാവം രേഖപ്പെടുത്തുക"
  },
  chat: {
    title: "കൂട്ടുകാരൻ",
    placeholder: "നിങ്ങളുടെ മനസ്സിലുള്ളത് പങ്കിടുക…",
    clear: "സംഭാഷണം മായ്ക്കുക",
    cleared: "സംഭാഷണം മായ്ച്ചു"
  },
  settings: {
    title: "ക്രമീകരണങ്ങൾ",
    language: "ഭാഷ",
    appearance: "രൂപം",
    theme: "തെളിച്ചം",
    about: "Oppuna കുറിച്ച്"
  }
};
