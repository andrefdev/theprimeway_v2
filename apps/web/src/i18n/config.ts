import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'

export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: ['common'],
    detection: {
      order: ['cookie', 'navigator'],
      lookupCookie: 'locale',
      caches: ['cookie'],
      cookieMinutes: 525600,
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  })

export default i18n
