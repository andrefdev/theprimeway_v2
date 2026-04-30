import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
} from 'date-fns'

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom'

export interface DateRange {
  start: string | null
  end: string | null
  preset: DateRangePreset
}

export const DEFAULT_PRESETS: DateRangePreset[] = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'last_7_days',
  'last_30_days',
  'this_year',
  'last_year',
  'all_time',
  'custom',
]

function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function resolveRange(
  preset: DateRangePreset,
  customStart?: string | null,
  customEnd?: string | null,
  weekStartsOn: 0 | 1 = 1,
): { start: string | null; end: string | null } {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { start: fmt(startOfDay(now)), end: fmt(endOfDay(now)) }
    case 'yesterday': {
      const y = subDays(now, 1)
      return { start: fmt(startOfDay(y)), end: fmt(endOfDay(y)) }
    }
    case 'this_week':
      return {
        start: fmt(startOfWeek(now, { weekStartsOn })),
        end: fmt(endOfWeek(now, { weekStartsOn })),
      }
    case 'last_week': {
      const w = subWeeks(now, 1)
      return {
        start: fmt(startOfWeek(w, { weekStartsOn })),
        end: fmt(endOfWeek(w, { weekStartsOn })),
      }
    }
    case 'this_month':
      return { start: fmt(startOfMonth(now)), end: fmt(endOfMonth(now)) }
    case 'last_month': {
      const m = subMonths(now, 1)
      return { start: fmt(startOfMonth(m)), end: fmt(endOfMonth(m)) }
    }
    case 'last_7_days':
      return { start: fmt(subDays(now, 6)), end: fmt(endOfDay(now)) }
    case 'last_30_days':
      return { start: fmt(subDays(now, 29)), end: fmt(endOfDay(now)) }
    case 'last_90_days':
      return { start: fmt(subDays(now, 89)), end: fmt(endOfDay(now)) }
    case 'this_year':
      return { start: fmt(startOfYear(now)), end: fmt(endOfYear(now)) }
    case 'last_year': {
      const y = subYears(now, 1)
      return { start: fmt(startOfYear(y)), end: fmt(endOfYear(y)) }
    }
    case 'all_time':
      return { start: null, end: null }
    case 'custom':
      return { start: customStart ?? null, end: customEnd ?? null }
  }
}

export function buildRange(
  preset: DateRangePreset,
  customStart?: string | null,
  customEnd?: string | null,
  weekStartsOn: 0 | 1 = 1,
): DateRange {
  const { start, end } = resolveRange(preset, customStart, customEnd, weekStartsOn)
  return { preset, start, end }
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

export function formatRangeLabel(range: DateRange, presetLabel: string): string {
  if (range.preset !== 'custom') return presetLabel
  if (!range.start || !range.end) return presetLabel
  const s = parseLocalDate(range.start)
  const e = parseLocalDate(range.end)
  if (s.getFullYear() === e.getFullYear()) {
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
  }
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`
}
