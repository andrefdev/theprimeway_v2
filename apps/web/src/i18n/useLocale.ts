import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import type { Locale } from 'date-fns'
import { getDateFnsLocale } from './date-locale'
import type { SupportedLocale } from './config'

export function useLocale() {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'en') as SupportedLocale
  const [dateFnsLocale, setDateFnsLocale] = useState<Locale | undefined>()

  useEffect(() => {
    getDateFnsLocale(lang).then(setDateFnsLocale)
  }, [lang])

  return {
    locale: lang,
    dateFnsLocale,
    changeLocale: (newLocale: SupportedLocale) => i18n.changeLanguage(newLocale),
  }
}
