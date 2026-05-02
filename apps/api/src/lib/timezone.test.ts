import { describe, expect, it } from 'vitest'
import {
  endOfLocalDayUtc,
  formatInTz,
  localDayOfWeek,
  localTimeToUtc,
  localYmd,
  startOfLocalDayUtc,
} from '@repo/shared/utils'

describe('timezone helpers', () => {
  it('localTimeToUtc converts Mexico City 18:00 to next-day 00:00 UTC (CST, no DST)', () => {
    // 2026-05-01 is in DST for Mexico City pre-2022, but Mexico has dropped DST.
    // America/Mexico_City is now CST year-round (UTC-6). 18:00 local = 00:00 UTC next day.
    const day = new Date('2026-05-01T12:00:00Z')
    const utc = localTimeToUtc(day, '18:00', 'America/Mexico_City')
    expect(utc.toISOString()).toBe('2026-05-02T00:00:00.000Z')
  })

  it('localTimeToUtc handles +05:45 Kathmandu', () => {
    const day = new Date('2026-05-01T12:00:00Z')
    const utc = localTimeToUtc(day, '09:00', 'Asia/Kathmandu')
    // 09:00 +05:45 = 03:15 UTC
    expect(utc.toISOString()).toBe('2026-05-01T03:15:00.000Z')
  })

  it('startOfLocalDayUtc and endOfLocalDayUtc bracket a 24h window', () => {
    const day = new Date('2026-05-01T15:00:00Z')
    const start = startOfLocalDayUtc(day, 'America/Mexico_City')
    const end = endOfLocalDayUtc(day, 'America/Mexico_City')
    expect(start.toISOString()).toBe('2026-05-01T06:00:00.000Z')
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000 - 1)
  })

  it('localYmd returns the user-local date for a near-midnight UTC instant', () => {
    // 03:00 UTC on 2026-05-02 is still 2026-05-01 21:00 in Mexico City.
    const inst = new Date('2026-05-02T03:00:00Z')
    expect(localYmd(inst, 'America/Mexico_City')).toBe('2026-05-01')
    expect(localYmd(inst, 'UTC')).toBe('2026-05-02')
  })

  it('localDayOfWeek matches user-local day', () => {
    // 2026-05-02 is a Saturday in UTC. At 03:00 UTC it is still Friday in Mexico City.
    const inst = new Date('2026-05-02T03:00:00Z')
    expect(localDayOfWeek(inst, 'UTC')).toBe(6)
    expect(localDayOfWeek(inst, 'America/Mexico_City')).toBe(5)
  })

  it('formatInTz produces expected user-local strings', () => {
    const inst = new Date('2026-05-02T03:00:00Z')
    expect(formatInTz(inst, 'America/Mexico_City', 'yyyy-MM-dd HH:mm')).toBe('2026-05-01 21:00')
  })
})
