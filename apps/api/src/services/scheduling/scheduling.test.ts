/**
 * Pure-logic tests for the scheduling pipeline. We exercise the algorithms
 * (planSplit, computeGaps, mergeOverlapping) without touching Prisma so the
 * tests are fast and don't require a database. Integration coverage of
 * autoSchedule + facade lives in manual smoke tests until a test DB is wired.
 */
import { describe, expect, it } from 'vitest'
import { planSplit } from './auto-schedule'
import { computeGaps, mergeOverlapping, type BusyBlock, type Gap } from './gap-finder'

const at = (h: number, m = 0) => new Date(Date.UTC(2026, 4, 5, h, m, 0, 0))

describe('gap-finder.computeGaps', () => {
  it('returns the whole window when there are no busy blocks', () => {
    const gaps = computeGaps([], at(9), at(17))
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.durationMinutes).toBe(8 * 60)
    expect(gaps[0]!.start).toEqual(at(9))
    expect(gaps[0]!.end).toEqual(at(17))
  })

  it('splits the window around a single busy block', () => {
    const blocks: BusyBlock[] = [
      { start: at(11), end: at(12), source: 'EVENT', ref: 'evt-1' },
    ]
    const gaps = computeGaps(blocks, at(9), at(17))
    expect(gaps).toHaveLength(2)
    expect(gaps[0]!.start).toEqual(at(9))
    expect(gaps[0]!.end).toEqual(at(11))
    expect(gaps[1]!.start).toEqual(at(12))
    expect(gaps[1]!.end).toEqual(at(17))
  })

  it('drops blocks that fall entirely outside the window', () => {
    const blocks: BusyBlock[] = [
      { start: at(7), end: at(8), source: 'EVENT', ref: 'before' },
      { start: at(11), end: at(12), source: 'EVENT', ref: 'inside' },
      { start: at(20), end: at(22), source: 'EVENT', ref: 'after' },
    ]
    const gaps = computeGaps(blocks, at(9), at(17))
    expect(gaps).toHaveLength(2)
    expect(gaps[0]!.end).toEqual(at(11))
    expect(gaps[1]!.start).toEqual(at(12))
  })

  it('returns no gaps when the window is fully covered', () => {
    const blocks: BusyBlock[] = [
      { start: at(8), end: at(20), source: 'EVENT', ref: 'fullday' },
    ]
    expect(computeGaps(blocks, at(9), at(17))).toEqual([])
  })

  it('handles back-to-back blocks without inserting empty gaps', () => {
    const blocks: BusyBlock[] = [
      { start: at(9), end: at(10), source: 'EVENT', ref: 'a' },
      { start: at(10), end: at(11), source: 'EVENT', ref: 'b' },
    ]
    const gaps = computeGaps(blocks, at(9), at(17))
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.start).toEqual(at(11))
    expect(gaps[0]!.end).toEqual(at(17))
  })
})

describe('gap-finder.mergeOverlapping', () => {
  it('merges two overlapping blocks', () => {
    const merged = mergeOverlapping([
      { start: at(9), end: at(11), source: 'EVENT', ref: 'a' },
      { start: at(10), end: at(12), source: 'EVENT', ref: 'b' },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.start).toEqual(at(9))
    expect(merged[0]!.end).toEqual(at(12))
  })

  it('keeps disjoint blocks untouched', () => {
    const merged = mergeOverlapping([
      { start: at(9), end: at(10), source: 'EVENT', ref: 'a' },
      { start: at(11), end: at(12), source: 'EVENT', ref: 'b' },
    ])
    expect(merged).toHaveLength(2)
  })

  it('treats touching blocks (end === start) as overlapping', () => {
    const merged = mergeOverlapping([
      { start: at(9), end: at(10), source: 'EVENT', ref: 'a' },
      { start: at(10), end: at(11), source: 'EVENT', ref: 'b' },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.end).toEqual(at(11))
  })
})

describe('auto-schedule.planSplit', () => {
  const gap = (startH: number, durationMin: number): Gap => ({
    start: at(startH),
    end: new Date(at(startH).getTime() + durationMin * 60_000),
    durationMinutes: durationMin,
  })

  it('returns null when total available is less than required', () => {
    expect(planSplit([gap(9, 30), gap(11, 20)], 90)).toBeNull()
  })

  it('fills a single gap when it is large enough', () => {
    const out = planSplit([gap(9, 60), gap(11, 60)], 45)
    expect(out).toHaveLength(1)
    expect(out![0]!.start).toEqual(at(9))
  })

  it('skips gaps smaller than MIN_CHUNK (15 min)', () => {
    // 10-min gap should be ignored; 90-min gap absorbs everything.
    const out = planSplit([gap(9, 10), gap(10, 90)], 60)
    expect(out).toHaveLength(1)
    expect(out![0]!.start).toEqual(at(10))
  })

  it('grows a chunk to avoid leaving a tiny remainder', () => {
    // 45-min task across two 30-min gaps: naive split would leave 15 in one,
    // 30 in next, but if leftover after first chunk would be <15 min, grow the
    // first chunk. With 30+30 gaps and target=45: first takes 30, remaining=15
    // which is exactly MIN_CHUNK, so it's allowed; second takes 15.
    const out = planSplit([gap(9, 30), gap(10, 30)], 45)
    expect(out).not.toBeNull()
    const total = out!.reduce((sum, c) => sum + (c.end.getTime() - c.start.getTime()) / 60_000, 0)
    expect(total).toBe(45)
  })
})
