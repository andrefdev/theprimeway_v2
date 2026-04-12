import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import es from './es.json';

export const i18n = new I18n({ en, es });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function setLocale(locale: 'en' | 'es') {
  i18n.locale = locale;
}
