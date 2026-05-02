/**
 * Gap-finder — given a day + user, compute available gaps
 * considering WorkingHours, CalendarEvents (busy, non-declined, visible),
 * and existing WorkingSessions. All timestamps are UTC DateTimes.
 *
 * Working-hours strings ("HH:mm") are interpreted in the user's timezone
 * via UserSettings.timezone (defaults to "UTC").
 *
 * Spec: docs/TASK_SCHEDULER_ALGO.md §4.
 */
import { prisma } from '../../lib/prisma'
import {
  endOfLocalDayUtc as endOfLocalDayUtcShared,
  localDayOfWeek,
  localTimeToUtc,
  localYmd,
  startOfLocalDayUtc as startOfLocalDayUtcShared,
} from '@repo/shared/utils'

async function getUserTz(userId: string): Promise<string> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timezone: true },
  })
  return settings?.timezone ?? 'UTC'
}

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

/** Combine a day with a "HH:mm" string interpreted in the user's tz. */
function combineDateTime(day: Date, hm: string, tz: string = 'UTC'): Date {
  return localTimeToUtc(day, hm, tz)
}

function startOfDay(day: Date, tz: string = 'UTC'): Date {
  return startOfLocalDayUtcShared(day, tz)
}

function endOfDay(day: Date, tz: string = 'UTC'): Date {
  return endOfLocalDayUtcShared(day, tz)
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
 * dayOfWeek is computed in the user's timezone.
 */
export async function getEffectiveWorkingHours(
  userId: string,
  channelId: string | null | undefined,
  day: Date,
): Promise<{ startTime: string; endTime: string } | null> {
  const tz = await getUserTz(userId)
  const date = localYmd(day, tz)
  // Per-day override (Sunsama-style draggable bars) wins over everything.
  const dayOverride = await prisma.workingHoursOverride.findUnique({
    where: { userId_date: { userId, date } },
  })
  if (dayOverride) return { startTime: dayOverride.startTime, endTime: dayOverride.endTime }

  const dayOfWeek = localDayOfWeek(day, tz)
  if (channelId) {
    const override = await prisma.workingHours.findFirst({ where: { userId, channelId, dayOfWeek } })
    if (override) return { startTime: override.startTime, endTime: override.endTime }
  }
  const def = await prisma.workingHours.findFirst({ where: { userId, channelId: null, dayOfWeek } })
  if (!def) return null
  return { startTime: def.startTime, endTime: def.endTime }
}

/** Build the day's working window in UTC, interpreting WorkingHours strings in the user's tz. */
export async function getDayWindow(
  userId: string,
  channelId: string | null | undefined,
  day: Date,
): Promise<DayWindow | null> {
  const wh = await getEffectiveWorkingHours(userId, channelId, day)
  if (!wh) return null
  const tz = await getUserTz(userId)
  return { start: combineDateTime(day, wh.startTime, tz), end: combineDateTime(day, wh.endTime, tz) }
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
  const tz = await getUserTz(userId)
  const dayStartUtc = startOfDay(day, tz)
  const dayEndUtc = endOfDay(day, tz)

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
