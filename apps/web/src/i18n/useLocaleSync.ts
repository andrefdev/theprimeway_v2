import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/shared/stores/auth.store'
import { SUPPORTED_LOCALES } from './config'
import type { SupportedLocale } from './config'

/**
 * Syncs the i18n locale with the authenticated user's settings.
 * Call once in the _app layout.
 */
export function useLocaleSync() {
  const { i18n } = useTranslation()
  const userLocale = useAuthStore((s) => s.user?.settings?.locale)

  useEffect(() => {
    if (
      userLocale &&
      SUPPORTED_LOCALES.includes(userLocale as SupportedLocale) &&
      i18n.language !== userLocale
    ) {
      i18n.changeLanguage(userLocale)
    }
  }, [userLocale, i18n])
}
