import type { DeepPartial } from '@/i18n/types';
import type { Translation } from '@/i18n/locales/en';

/** Hindi translations. Missing keys fall back to English automatically. */
export const hi: DeepPartial<Translation> = {
  common: {
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    edit: 'संपादित करें',
    done: 'पूर्ण',
    close: 'बंद करें',
    back: 'वापस',
    continue: 'जारी रखें',
    confirm: 'पुष्टि करें',
    search: 'खोजें',
    loading: 'लोड हो रहा है…',
    retry: 'पुनः प्रयास करें',
    optional: 'वैकल्पिक',
    empty: 'अभी यहाँ कुछ नहीं है',
  },
  tabs: {
    home: 'होम',
    chat: 'बातचीत',
    mood: 'मनोदशा',
    journal: 'डायरी',
    settings: 'सेटिंग्स',
  },
  home: {
    greetingMorning: 'सुप्रभात',
    greetingAfternoon: 'नमस्कार',
    greetingEvening: 'शुभ संध्या',
    howAreYou: 'आज आप कैसा महसूस कर रहे हैं?',
    quickActions: 'त्वरित क्रियाएँ',
    talk: 'बात करें',
    breathe: 'साँस लें',
    ground: 'ग्राउंडिंग',
    sleep: 'नींद सहायता',
    selfCare: 'स्व-देखभाल योजना',
    insights: 'अंतर्दृष्टि',
    logMood: 'मनोदशा दर्ज करें',
  },
  chat: {
    agentLabel: 'बातचीत साथी',
    agentSwitched: 'अब आप बात कर रहे हैं',
    agents: {
      companion: {
        name: 'साथी',
        description: 'रोज़मर्रा की बातचीत के लिए एक गर्मजोशी भरा दोस्त।',
      },
      mental_health: {
        name: 'मानसिक स्वास्थ्य सहारा',
        description:
          'ग्राउंडिंग, साँस और सोच बदलने के साथ कोमल भावनात्मक सहारा — निजी और आपके डिवाइस पर। यह थेरेपी नहीं है।',
      },
    },
  },
  settings: {
    title: 'सेटिंग्स',
    appearance: 'रूप',
    theme: 'थीम',
    language: 'भाषा',
    privacy: 'गोपनीयता विवरण',
    disclaimer: 'चिकित्सा अस्वीकरण',
    exportData: 'मेरा डेटा निर्यात करें',
    deleteData: 'सारा डेटा हटाएँ',
    appLock: 'ऐप लॉक',
    appLockDescription: 'Oppuna खोलने के लिए अपनी फ़िंगरप्रिंट, चेहरा या डिवाइस पिन ज़रूरी करें।',
    appLockEnabled: 'ऐप लॉक चालू हो गया।',
    appLockDisabled: 'ऐप लॉक बंद हो गया।',
    appLockUnavailable:
      'ऐप लॉक उपयोग करने के लिए अपने फ़ोन की सेटिंग्स में फ़िंगरप्रिंट, फ़ेस अनलॉक या पिन सेट करें।',
    appLockNotVerified: 'ऐप लॉक नहीं बदला — सत्यापन रद्द कर दिया गया।',
    about: 'Oppuna के बारे में',
    themeLight: 'हल्का',
    themeDark: 'गहरा',
    themeSystem: 'सिस्टम',
  },
  lock: {
    title: 'Oppuna लॉक है',
    subtitle: 'अपना निजी स्थान खोलने के लिए पुष्टि करें कि यह आप हैं।',
    prompt: 'Oppuna अनलॉक करें',
    setupPrompt: 'ऐप लॉक चालू करने के लिए पुष्टि करें कि यह आप हैं',
    disablePrompt: 'ऐप लॉक बंद करने के लिए पुष्टि करें कि यह आप हैं',
    unlock: 'अनलॉक करें',
    unlocking: 'सत्यापन हो रहा है…',
  },
  safety: {
    title: 'आपको अभी सहायता पाने का हक़ है',
    body:
      'मुझे आपकी सुरक्षा की बहुत चिंता है। Oppuna अकेले इसमें मदद नहीं कर सकता, और आप इतने महत्वपूर्ण हैं कि इसे अकेले सामना न करें।',
    emergency: 'अगर आप तुरंत ख़तरे में हैं, तो अभी अपनी स्थानीय आपातकालीन सेवाओं से संपर्क करें।',
    trusted: 'कृपया अपने पास किसी विश्वसनीय व्यक्ति से संपर्क करें।',
    breathe: 'धीरे-धीरे साँस लें',
    backToSafety: 'मैं अभी सुरक्षित हूँ',
    callEmergency: 'आपातकालीन सेवा को कॉल करें',
    chooseRegion: 'स्थानीय हेल्पलाइन के लिए अपना क्षेत्र चुनें',
    helplinesFor: 'इसके लिए हेल्पलाइन',
    moreRegions: 'अन्य क्षेत्र',
    disclaimer:
      'ये नंबर सुविधा के लिए दिए गए हैं और बदल सकते हैं। यदि कोई न जुड़े, तो अपनी स्थानीय आपातकालीन सेवाओं से संपर्क करें।',
  },
};
