import type { SupportedLocale } from './config'

const LOCALE_TO_INTL: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  currency = 'USD',
  minimumFractionDigits = 2,
): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale] ?? 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: Math.max(minimumFractionDigits, 2),
  }).format(amount)
}

export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale] ?? 'en-US', options).format(value)
}
