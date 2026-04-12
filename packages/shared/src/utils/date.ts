/** Format a date string to localized format */
export function formatDate(
  dateStr: string,
  locale = 'en-US',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/** Format a date as relative (e.g., "2 hours ago") */
export function formatRelativeDate(dateStr: string, locale = 'en-US'): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMins < 1) return rtf.format(0, 'minute')
  if (diffMins < 60) return rtf.format(-diffMins, 'minute')
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return rtf.format(-diffDays, 'day')
  const diffMonths = Math.floor(diffDays / 30)
  return rtf.format(-diffMonths, 'month')
}

/** Check if a date string is today */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/** Check if a date string is tomorrow */
export function isTomorrow(dateStr: string): boolean {
  const date = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  )
}
