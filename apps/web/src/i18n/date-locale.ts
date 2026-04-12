import type { Locale } from 'date-fns'
import type { SupportedLocale } from './config'

const localeMap: Record<SupportedLocale, () => Promise<Locale>> = {
  en: async () => (await import('date-fns/locale/en-US')).enUS,
  es: async () => (await import('date-fns/locale/es')).es,
}

let cachedLocale: { key: string; locale: Locale } | null = null

export async function getDateFnsLocale(lang: SupportedLocale): Promise<Locale> {
  if (cachedLocale?.key === lang) return cachedLocale.locale
  const locale = await localeMap[lang]()
  cachedLocale = { key: lang, locale }
  return locale
}
