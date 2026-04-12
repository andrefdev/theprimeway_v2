import { i18n, setLocale } from '@/i18n';
import { useSettingsStore } from '@shared/stores/settingsStore';

export function useTranslation(namespace?: string) {
  const locale = useSettingsStore((s) => s.locale);

  // Sync i18n-js locale with store
  if (i18n.locale !== locale) {
    setLocale(locale);
  }

  return {
    t: (key: string, params?: Record<string, unknown>) =>
      i18n.t(namespace ? `${namespace}.${key}` : key, params),
    locale,
  };
}
