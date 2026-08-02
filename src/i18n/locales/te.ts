import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Telugu translations. Missing keys fall back to English automatically. */
export const te: DeepPartial<Translation> = {
  common: {
    save: "సేవ్",
    cancel: "రద్దు",
    delete: "తొలగించు",
    edit: "సవరించు",
    done: "పూర్తయింది",
    close: "మూసివేయి",
    back: "వెనుకకు",
    continue: "కొనసాగించు",
    confirm: "నిర్ధారించు",
    search: "వెతకండి",
    loading: "లోడ్ అవుతోంది…",
    retry: "మళ్లీ ప్రయత్నించు",
    optional: "ఐచ్ఛికం",
    empty: "ఇంకా ఏమీ లేదు"
  },
  tabs: {
    home: "హోమ్",
    chat: "చాట్",
    mood: "మూడ్",
    journal: "జర్నల్",
    settings: "సెట్టింగ్‌లు"
  },
  home: {
    greetingMorning: "శుభోదయం",
    greetingAfternoon: "నమస్కారం",
    greetingEvening: "శుభ సాయంత్రం",
    howAreYou: "ఈరోజు మీరు ఎలా ఉన్నారు?",
    quickActions: "త్వరిత చర్యలు",
    talk: "మాట్లాడండి",
    breathe: "ఊపిరి",
    ground: "గ్రౌండింగ్",
    sleep: "నిద్ర మద్దతు",
    selfCare: "స్వయం సంరక్షణ",
    insights: "అంతర్దృష్టి",
    logMood: "మూడ్ నమోదు"
  },
  chat: {
    title: "సహచరుడు",
    placeholder: "మీ మనసులో ఉన్నది పంచుకోండి…",
    clear: "సంభాషణను తొలగించు",
    cleared: "సంభాషణ తొలగించబడింది"
  },
  settings: {
    title: "సెట్టింగ్‌లు",
    language: "భాష",
    appearance: "రూపం",
    theme: "కాంతి",
    about: "Oppuna గురించి"
  }
};
