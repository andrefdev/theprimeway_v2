/**
 * Natural-language capture parser.
 *
 * Extracts planned duration, channel hint, and day hint from free text,
 * returning the remaining text as the task title.
 *
 * Examples:
 *   "30m write blog post #writing @tomorrow"
 *     → { title: "write blog post", plannedMinutes: 30, channelName: "writing", day: "<tomorrow-ISO>" }
 *   "1h30m review PRs @mon"
 *     → { title: "review PRs", plannedMinutes: 90, day: "<next-monday>" }
 *
 * Day keywords (case-insensitive): today, tomorrow, mon/tue/wed/thu/fri/sat/sun.
 * Also accepts @YYYY-MM-DD.
 */

export type ParsedBucket =
  | 'TODAY'
  | 'TOMORROW'
  | 'NEXT_WEEK'
  | 'NEXT_MONTH'
  | 'NEXT_QUARTER'
  | 'NEXT_YEAR'
  | 'SOMEDAY'
  | 'NEVER'

export interface ParsedCapture {
  title: string
  plannedMinutes?: number
  channelName?: string
  /** yyyy-mm-dd, resolved against `reference` */
  day?: string
  bucket?: ParsedBucket
}

const BUCKET_TOKENS: Record<string, ParsedBucket> = {
  nextweek: 'NEXT_WEEK',
  'next-week': 'NEXT_WEEK',
  nextmonth: 'NEXT_MONTH',
  'next-month': 'NEXT_MONTH',
  nextquarter: 'NEXT_QUARTER',
  'next-quarter': 'NEXT_QUARTER',
  nextyear: 'NEXT_YEAR',
  'next-year': 'NEXT_YEAR',
  someday: 'SOMEDAY',
  never: 'NEVER',
}

const DURATION_RE = /(?:^|\s)(\d+)h(\d+)m(?=\s|$)|(?:^|\s)(\d+)h(?=\s|$)|(?:^|\s)(\d+)m(?=\s|$)/i
const CHANNEL_RE = /(?:^|\s)#([a-z0-9_-]+)(?=\s|$)/i
const DAY_RE = /(?:^|\s)@([a-z0-9-]+)(?=\s|$)/i

const DAY_ABBREV: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

export function parseCapture(text: string, reference: Date = new Date()): ParsedCapture {
  let rest = text.trim()
  const out: ParsedCapture = { title: rest }

  const dur = rest.match(DURATION_RE)
  if (dur) {
    let mins = 0
    if (dur[1] && dur[2]) mins = Number(dur[1]) * 60 + Number(dur[2])
    else if (dur[3]) mins = Number(dur[3]) * 60
    else if (dur[4]) mins = Number(dur[4])
    if (mins > 0) {
      out.plannedMinutes = mins
      rest = rest.replace(dur[0], ' ').trim()
    }
  }

  const ch = rest.match(CHANNEL_RE)
  if (ch) {
    out.channelName = ch[1]!.toLowerCase()
    rest = rest.replace(ch[0], ' ').trim()
  }

  const day = rest.match(DAY_RE)
  if (day) {
    const token = day[1]!.toLowerCase()
    const bucket = BUCKET_TOKENS[token]
    if (bucket) {
      out.bucket = bucket
      rest = rest.replace(day[0], ' ').trim()
    } else {
      const resolved = resolveDay(token, reference)
      if (resolved) {
        out.day = resolved
        rest = rest.replace(day[0], ' ').trim()
      }
    }
  }

  out.title = rest.replace(/\s+/g, ' ').trim()
  return out
}

function resolveDay(token: string, reference: Date): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token

  const today = new Date(reference)
  today.setHours(0, 0, 0, 0)

  if (token === 'today') return toYMD(today)
  if (token === 'tomorrow') {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return toYMD(d)
  }

  const target = DAY_ABBREV[token.slice(0, 3)]
  if (target === undefined) return null
  const current = today.getDay()
  let delta = (target - current + 7) % 7
  if (delta === 0) delta = 7 // "next mon" when today is mon
  const d = new Date(today)
  d.setDate(d.getDate() + delta)
  return toYMD(d)
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
