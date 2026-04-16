import type { SupportedLocale } from './config'

const LOCALE_TO_INTL: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

function intlLocale(locale: SupportedLocale): string {
  return LOCALE_TO_INTL[locale] ?? 'en-US'
}

export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  currency = 'USD',
  minimumFractionDigits = 2,
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
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
  return new Intl.NumberFormat(intlLocale(locale), options).format(value)
}

/** Format a date using app locale. Default: short date (e.g. "4/16/2026" or "16/4/2026") */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString(intlLocale(locale), options)
}

/** Format time using app locale. Default: hour + minute (e.g. "2:30 PM" or "14:30") */
export function formatTime(
  date: Date | string | number,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString(intlLocale(locale), options)
}

/** Format month label (e.g. "Jan", "Ene") */
export function formatMonth(
  date: Date | string | number,
  locale: SupportedLocale,
  style: 'short' | 'long' = 'short',
): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString(intlLocale(locale), { month: style })
}
