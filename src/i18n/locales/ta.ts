import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Tamil translations. Missing keys fall back to English automatically. */
export const ta: DeepPartial<Translation> = {
  common: {
    save: 'சேமி',
    cancel: 'ரத்து',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    done: 'முடிந்தது',
    close: 'மூடு',
    back: 'பின்',
    continue: 'தொடர்',
    confirm: 'உறுதிப்படுத்து',
    search: 'தேடு',
    loading: 'ஏற்றுகிறது…',
    retry: 'மீண்டும் முயற்சி',
    optional: 'விருப்பத்தேர்வு',
    empty: 'இன்னும் எதுவும் இல்லை',
  },
  tabs: {
    home: 'முகப்பு',
    chat: 'அரட்டை',
    mood: 'மனநிலை',
    journal: 'நாட்குறிப்பு',
    settings: 'அமைப்புகள்',
  },
  home: {
    greetingMorning: 'காலை வணக்கம்',
    greetingAfternoon: 'வணக்கம்',
    greetingEvening: 'மாலை வணக்கம்',
    howAreYou: 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
    quickActions: 'விரைவு செயல்கள்',
    talk: 'பேசுங்கள்',
    breathe: 'சுவாசம்',
    ground: 'தரையூட்டம்',
    sleep: 'தூக்க உதவி',
    selfCare: 'சுய பராமரிப்பு',
    insights: 'நுண்ணறிவு',
    logMood: 'மனநிலை பதிவு',
  },
  chat: {
    title: 'தோழர்',
    placeholder: 'உங்கள் மனதில் உள்ளதைப் பகிரவும்…',
    clear: 'உரையாடலை அழி',
    cleared: 'உரையாடல் அழிக்கப்பட்டது',
  },
  settings: {
    title: 'அமைப்புகள்',
    language: 'மொழி',
    appearance: 'தோற்றம்',
    theme: 'ஒளி',
    about: 'Oppuna பற்றி',
  },
};
