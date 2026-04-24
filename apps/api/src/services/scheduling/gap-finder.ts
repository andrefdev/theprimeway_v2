/**
 * Gap-finder — given a day + user, compute available gaps
 * considering WorkingHours, CalendarEvents (busy, non-declined, visible),
 * and existing WorkingSessions. All timestamps are UTC DateTimes.
 *
 * Spec: docs/TASK_SCHEDULER_ALGO.md §4.
 */
import { prisma } from '../../lib/prisma'

export interface Gap {
  start: Date
  end: Date
  durationMinutes: number
}

export interface BusyBlock {
  start: Date
  end: Date
  source: 'EVENT' | 'SESSION'
  ref: string
}

export interface DayWindow {
  start: Date
  end: Date
}

/** Parse "HH:mm" into hours/minutes. */
function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

/** Combine a Date (yyyy-mm-dd) with a "HH:mm" string (UTC). */
function combineDateTime(day: Date, hm: string): Date {
  const { h, m } = parseHM(hm)
  const d = new Date(day)
  d.setUTCHours(h, m, 0, 0)
  return d
}

function startOfDay(day: Date): Date {
  const d = new Date(day)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function endOfDay(day: Date): Date {
  const d = new Date(day)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000)
}

function subMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() - mins * 60_000)
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000)
}

export const dt = { startOfDay, endOfDay, addMinutes, subMinutes, diffMinutes, combineDateTime }

/**
 * Effective working hours for (user, channel, day).
 * Channel override > user default. null if no rule (day is non-working).
 */
export async function getEffectiveWorkingHours(
  userId: string,
  channelId: string | null | undefined,
  day: Date,
): Promise<{ startTime: string; endTime: string } | null> {
  const dayOfWeek = day.getUTCDay()
  if (channelId) {
    const override = await prisma.workingHours.findFirst({ where: { userId, channelId, dayOfWeek } })
    if (override) return { startTime: override.startTime, endTime: override.endTime }
  }
  const def = await prisma.workingHours.findFirst({ where: { userId, channelId: null, dayOfWeek } })
  if (!def) return null
  return { startTime: def.startTime, endTime: def.endTime }
}

/** Build the day's working window in UTC. */
export async function getDayWindow(
  userId: string,
  channelId: string | null | undefined,
  day: Date,
): Promise<DayWindow | null> {
  const wh = await getEffectiveWorkingHours(userId, channelId, day)
  if (!wh) return null
  return { start: combineDateTime(day, wh.startTime), end: combineDateTime(day, wh.endTime) }
}

/**
 * Collect busy blocks for a user+day, expanded by `gapMinutes` on each side.
 * @param excludeSessionId optional session id to exclude (e.g. when re-scheduling itself).
 */
export async function collectBusyBlocks(
  userId: string,
  day: Date,
  gapMinutes: number,
  excludeSessionId?: string,
): Promise<BusyBlock[]> {
  const dayStartUtc = startOfDay(day)
  const dayEndUtc = endOfDay(day)

  const [events, sessions] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        calendar: { account: { userId } },
        isBusy: true,
        isDeclined: false,
        start: { lt: dayEndUtc },
        end: { gt: dayStartUtc },
      },
      select: { id: true, start: true, end: true },
    }),
    prisma.workingSession.findMany({
      where: {
        userId,
        start: { lt: dayEndUtc },
        end: { gt: dayStartUtc },
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      },
      select: { id: true, start: true, end: true },
    }),
  ])

  const blocks: BusyBlock[] = []
  for (const e of events) {
    blocks.push({
      start: subMinutes(e.start, gapMinutes),
      end: addMinutes(e.end, gapMinutes),
      source: 'EVENT',
      ref: e.id,
    })
  }
  for (const s of sessions) {
    blocks.push({
      start: subMinutes(s.start, gapMinutes),
      end: addMinutes(s.end, gapMinutes),
      source: 'SESSION',
      ref: s.id,
    })
  }

  blocks.sort((a, b) => a.start.getTime() - b.start.getTime())
  return mergeOverlapping(blocks)
}

export function mergeOverlapping(sorted: BusyBlock[]): BusyBlock[] {
  if (sorted.length === 0) return []
  const out: BusyBlock[] = [sorted[0]!]
  for (let i = 1; i < sorted.length; i++) {
    const prev = out[out.length - 1]!
    const cur = sorted[i]!
    if (cur.start <= prev.end) {
      if (cur.end > prev.end) prev.end = cur.end
    } else {
      out.push(cur)
    }
  }
  return out
}

/**
 * Compute gaps inside [windowStart, windowEnd], given busy blocks.
 * Only returns gaps with durationMinutes > 0.
 */
export function computeGaps(blocks: BusyBlock[], windowStart: Date, windowEnd: Date): Gap[] {
  const gaps: Gap[] = []
  let cursor = windowStart
  for (const b of blocks) {
    if (b.end <= windowStart) continue
    if (b.start >= windowEnd) break
    if (b.start > cursor) {
      gaps.push({ start: cursor, end: b.start, durationMinutes: diffMinutes(cursor, b.start) })
    }
    if (b.end > cursor) cursor = b.end
  }
  if (cursor < windowEnd) {
    gaps.push({ start: cursor, end: windowEnd, durationMinutes: diffMinutes(cursor, windowEnd) })
  }
  return gaps.filter((g) => g.durationMinutes > 0)
}

/**
 * Find any CalendarEvent overlapping [start, end] for userId (busy + not declined).
 * Used by early-completion-reflow to respect hard constraints.
 */
export async function findCalendarEventOverlapping(userId: string, start: Date, end: Date) {
  return prisma.calendarEvent.findFirst({
    where: {
      calendar: { account: { userId } },
      isBusy: true,
      isDeclined: false,
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true, start: true, end: true },
  })
}
