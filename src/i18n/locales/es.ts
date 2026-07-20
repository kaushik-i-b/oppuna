import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Spanish translations. Missing keys fall back to English automatically. */
export const es: DeepPartial<Translation> = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Listo',
    close: 'Cerrar',
    back: 'Atrás',
    continue: 'Continuar',
    confirm: 'Confirmar',
    search: 'Buscar',
    loading: 'Cargando…',
    retry: 'Reintentar',
    optional: 'Opcional',
    empty: 'Aún no hay nada aquí',
  },
  tabs: {
    home: 'Inicio',
    chat: 'Charla',
    mood: 'Ánimo',
    journal: 'Diario',
    settings: 'Ajustes',
  },
  home: {
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    howAreYou: '¿Cómo te sientes hoy?',
    quickActions: 'Acciones rápidas',
    talk: 'Conversar',
    breathe: 'Respirar',
    ground: 'Conexión',
    sleep: 'Apoyo para dormir',
    selfCare: 'Plan de autocuidado',
    insights: 'Resumen',
    logMood: 'Registrar ánimo',
  },
  chat: {
    agentLabel: 'Hablando con',
    agentSwitched: 'Ahora hablas con',
    agents: {
      companion: {
        name: 'Compañía',
        description: 'Una amistad cálida para el día a día.',
      },
      mental_health: {
        name: 'Apoyo emocional',
        description:
          'Apoyo emocional suave con conexión a tierra, respiración y reencuadre — privado y en tu dispositivo. No es terapia.',
      },
    },
  },
  settings: {
    title: 'Ajustes',
    appearance: 'Apariencia',
    theme: 'Tema',
    language: 'Idioma',
    privacy: 'Declaración de privacidad',
    disclaimer: 'Aviso médico',
    exportData: 'Exportar mis datos',
    deleteData: 'Eliminar todos los datos',
    appLock: 'Bloqueo de la app',
    appLockDescription: 'Requiere tu huella, rostro o PIN del dispositivo para abrir Oppuna.',
    appLockEnabled: 'Bloqueo de la app activado.',
    appLockDisabled: 'Bloqueo de la app desactivado.',
    appLockUnavailable:
      'Configura una huella, desbloqueo facial o PIN en los ajustes de tu teléfono para usar el bloqueo.',
    appLockNotVerified: 'El bloqueo no cambió: se canceló la verificación.',
    about: 'Acerca de Oppuna',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
  },
  lock: {
    title: 'Oppuna está bloqueada',
    subtitle: 'Verifica tu identidad para abrir tu espacio privado.',
    prompt: 'Desbloquear Oppuna',
    setupPrompt: 'Confirma tu identidad para activar el bloqueo',
    disablePrompt: 'Confirma tu identidad para desactivar el bloqueo',
    unlock: 'Desbloquear',
    unlocking: 'Verificando…',
  },
  safety: {
    title: 'Mereces apoyo en este momento',
    body:
      'Me preocupa mucho tu seguridad. Oppuna no puede ayudarte con esto por sí sola, y eres demasiado importante para enfrentarlo en soledad.',
    emergency: 'Si estás en peligro inmediato, contacta ahora a los servicios de emergencia locales.',
    trusted: 'Por favor, comunícate con alguien de confianza cerca de ti.',
    breathe: 'Respira despacio',
    backToSafety: 'Estoy a salvo por ahora',
    callEmergency: 'Llamar a emergencias',
    chooseRegion: 'Elige tu región para ver líneas de ayuda locales',
    helplinesFor: 'Líneas de ayuda para',
    moreRegions: 'Otras regiones',
    disclaimer:
      'Estos números se ofrecen por conveniencia y pueden cambiar. Si uno no conecta, contacta a tus servicios de emergencia locales.',
  },
};
