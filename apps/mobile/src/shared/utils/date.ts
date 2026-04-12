import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const locales = { en: enUS, es };

export function getLocale(locale: string) {
  return locales[locale as keyof typeof locales] || enUS;
}

export function formatDate(date: string | Date, fmt: string = 'PP', locale: string = 'en') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: getLocale(locale) });
}

export function formatRelative(date: string | Date, locale: string = 'en') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: getLocale(locale) });
}

export function getDayLabel(date: string | Date, locale: string = 'en') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return locale === 'es' ? 'Hoy' : 'Today';
  if (isTomorrow(d)) return locale === 'es' ? 'Mañana' : 'Tomorrow';
  if (isYesterday(d)) return locale === 'es' ? 'Ayer' : 'Yesterday';
  return format(d, 'EEEE, MMM d', { locale: getLocale(locale) });
}
