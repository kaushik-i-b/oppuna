import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Russian translations. Missing keys fall back to English automatically. */
export const ru: DeepPartial<Translation> = {
  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Изменить',
    done: 'Готово',
    close: 'Закрыть',
    back: 'Назад',
    continue: 'Продолжить',
    confirm: 'Подтвердить',
    search: 'Поиск',
    loading: 'Загрузка…',
    retry: 'Повторить',
    optional: 'Необязательно',
    empty: 'Пока здесь ничего нет',
  },
  tabs: {
    home: 'Главная',
    chat: 'Чат',
    mood: 'Настроение',
    journal: 'Дневник',
    settings: 'Настройки',
  },
  home: {
    greetingMorning: 'Доброе утро',
    greetingAfternoon: 'Добрый день',
    greetingEvening: 'Добрый вечер',
    howAreYou: 'Как вы себя чувствуете сегодня?',
    quickActions: 'Быстрые действия',
    talk: 'Поговорить',
    breathe: 'Дыхание',
    ground: 'Заземление',
    sleep: 'Поддержка сна',
    selfCare: 'Забота о себе',
    insights: 'Обзор',
    logMood: 'Записать настроение',
  },
  chat: {
    title: 'Компаньон',
    placeholder: 'Поделитесь тем, что у вас на уме…',
    clear: 'Очистить разговор',
    cleared: 'Разговор очищен',
  },
  settings: {
    title: 'Настройки',
    language: 'Язык',
    appearance: 'Оформление',
    theme: 'Яркость',
    about: 'О Oppuna',
  },
  safety: {
    title: 'Вам нужна поддержка прямо сейчас',
    emergency: 'Если вы в непосредственной опасности, немедленно обратитесь в местные службы экстренной помощи.',
    breathe: 'Сделайте медленный вдох',
    backToSafety: 'Сейчас я в безопасности',
    callEmergency: 'Вызвать экстренные службы',
  },
};
