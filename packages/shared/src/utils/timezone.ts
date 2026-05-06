import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const HHMM_RE = /^(\d{1,2}):(\d{2})$/

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function ymdInTz(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

/**
 * Convert a local-clock "HH:mm" on the given anchor day to a UTC instant.
 * The anchor day is interpreted in `timeZone` (any instant within the user's
 * local day yields the same Y-M-D). Handles DST: ambiguous "fall-back" times
 * resolve to the earlier offset; non-existent "spring-forward" times are
 * skipped forward, both per `date-fns-tz` `fromZonedTime` semantics.
 */
export function localTimeToUtc(day: Date, hhmm: string, timeZone: string): Date {
  const m = HHMM_RE.exec(hhmm)
  const hh = m ? Number(m[1]) : 0
  const mm = m ? Number(m[2]) : 0
  const { y, m: mo, d } = ymdInTz(day, timeZone)
  const local = `${y}-${pad2(mo)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:00`
  return fromZonedTime(local, timeZone)
}

/** Format a UTC Date in the given IANA timezone using a date-fns format string. */
export function formatInTz(date: Date, timeZone: string, fmt: string): string {
  return formatInTimeZone(date, timeZone, fmt)
}

/** UTC instant corresponding to 00:00:00.000 local time on the given day. */
export function startOfLocalDayUtc(date: Date, timeZone: string): Date {
  return localTimeToUtc(date, '00:00', timeZone)
}

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Resolve a "YYYY-MM-DD" string to the UTC instant of midnight (00:00) on
 * that day in the user's timezone. Use this when the caller knows the date
 * as a calendar date (e.g. from a request body) and needs an anchor `Date`
 * that lives unambiguously inside the user's local day — independent of
 * UTC-vs-local arithmetic pitfalls. Throws on malformed input.
 */
export function ymdToLocalDayUtc(ymd: string, timeZone: string): Date {
  const m = YMD_RE.exec(ymd)
  if (!m) throw new Error(`Invalid YMD: ${ymd}`)
  return fromZonedTime(`${m[1]}-${m[2]}-${m[3]}T00:00:00`, timeZone)
}

/** UTC instant corresponding to 23:59:59.999 local time on the given day. */
export function endOfLocalDayUtc(date: Date, timeZone: string): Date {
  const start = localTimeToUtc(date, '00:00', timeZone)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/** "YYYY-MM-DD" for the given UTC instant in the user's timezone. */
export function localYmd(date: Date, timeZone: string): string {
  const { y, m, d } = ymdInTz(date, timeZone)
  return `${y}-${pad2(m)}-${pad2(d)}`
}

/**
 * "YYYY-MM-DD" of Monday (ISO week start) for the user's local week
 * containing `date`. Anchors on the user's local day so DST/timezone
 * shifts can't pull the result into the previous or next week.
 */
export function localIsoWeekStartYmd(date: Date, timeZone: string): string {
  const { y, m, d } = ymdInTz(date, timeZone)
  const local = new Date(y, m - 1, d)
  const dow = local.getDay() // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  local.setDate(local.getDate() + diff)
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`
}

/** 0=Sun..6=Sat for the given UTC instant in the user's timezone. */
export function localDayOfWeek(date: Date, timeZone: string): number {
  const wk = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[wk] ?? 0
}

/** IANA timezone of the device running this code. Falls back to "UTC". */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** All IANA timezone names supported by the runtime, with a fallback. */
export function listAvailableTimeZones(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
    if (typeof supported === 'function') return supported.call(Intl, 'timeZone')
  } catch {
    // fall through
  }
  return [getDeviceTimeZone(), 'UTC']
}
