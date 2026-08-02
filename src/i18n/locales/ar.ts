import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Arabic translations. Missing keys fall back to English automatically. */
export const ar: DeepPartial<Translation> = {
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    done: 'تم',
    close: 'إغلاق',
    back: 'رجوع',
    continue: 'متابعة',
    confirm: 'تأكيد',
    search: 'بحث',
    loading: 'جارٍ التحميل…',
    retry: 'إعادة المحاولة',
    optional: 'اختياري',
    empty: 'لا يوجد شيء هنا بعد',
  },
  tabs: {
    home: 'الرئيسية',
    chat: 'محادثة',
    mood: 'المزاج',
    journal: 'اليوميات',
    settings: 'الإعدادات',
  },
  home: {
    greetingMorning: 'صباح الخير',
    greetingAfternoon: 'مرحباً',
    greetingEvening: 'مساء الخير',
    howAreYou: 'كيف تشعر اليوم؟',
    quickActions: 'إجراءات سريعة',
    talk: 'تحدث',
    breathe: 'تنفس',
    ground: 'تأسيس',
    sleep: 'دعم النوم',
    selfCare: 'الرعاية الذاتية',
    insights: 'رؤى',
    logMood: 'سجّل المزاج',
  },
  chat: {
    title: 'الرفيق',
    placeholder: 'شاركنا ما يدور في ذهنك…',
    clear: 'مسح المحادثة',
    cleared: 'تم مسح المحادثة',
  },
  settings: {
    title: 'الإعدادات',
    language: 'اللغة',
    appearance: 'المظهر',
    theme: 'السطوع',
    about: 'حول Oppuna',
  },
  safety: {
    title: 'أنت تستحق الدعم الآن',
    emergency: 'إذا كنت في خطر فوري، اتصل بخدمات الطوارئ المحلية الآن.',
    breathe: 'خذ نفساً بطيئاً',
    backToSafety: 'أنا بأمان الآن',
    callEmergency: 'الاتصال بالطوارئ',
  },
};
