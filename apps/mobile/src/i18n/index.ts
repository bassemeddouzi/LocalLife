import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { ar, en, fr } from './resources';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
const start = ['en', 'fr', 'ar'].includes(deviceLang) ? deviceLang : 'en';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: start,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
