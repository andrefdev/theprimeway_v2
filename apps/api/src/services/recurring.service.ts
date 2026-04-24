/**
 * RecurringSeries — CRUD + materializer.
 * Materializer generates Task instances from active series whose pattern
 * matches a reference date. Idempotent per (series, day).
 *
 * Call sites for materializer:
 *   - /rituals/today (opportunistic, on user load)
 *   - /recurring-series/materialize (explicit/admin)
 *   - future cron at 00:05 daily
 */
import { prisma } from '../lib/prisma'
import { recurringRepo, type RecurringCreate } from '../repositories/recurring.repo'

export interface MaterializeResult {
  created: number
  skipped: number
  seriesChecked: number
}

function ymd(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function matchesPattern(
  pattern: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY',
  daysOfWeek: number[],
  startDate: Date,
  ref: Date,
): boolean {
  const dow = ref.getUTCDay()
  switch (pattern) {
    case 'DAILY':
      return true
    case 'WEEKDAYS':
      return dow >= 1 && dow <= 5
    case 'WEEKLY':
      return daysOfWeek.length > 0 ? daysOfWeek.includes(dow) : dow === startDate.getUTCDay()
    case 'MONTHLY':
      return ref.getUTCDate() === startDate.getUTCDate()
    default:
      return false
  }
}

class RecurringService {
  list(userId: string) { return recurringRepo.listByUser(userId) }
  create(userId: string, data: RecurringCreate) { return recurringRepo.create(userId, data) }
  update(userId: string, id: string, data: Partial<RecurringCreate>) { return recurringRepo.update(id, userId, data) }
  delete(userId: string, id: string) { return recurringRepo.delete(id, userId) }

  async materializeForUser(userId: string, referenceDate: Date = new Date()): Promise<MaterializeResult> {
    const ref = ymd(referenceDate)
    const series = await recurringRepo.findActiveForDate(userId, ref)

    let created = 0
    let skipped = 0

    for (const s of series) {
      if (!matchesPattern(s.pattern as any, s.daysOfWeek ?? [], s.startDate, ref)) {
        skipped++
        continue
      }
      const existing = await recurringRepo.findExistingInstance(userId, s.id, ref)
      if (existing) {
        skipped++
        continue
      }
      await recurringRepo.createTaskFromTemplate(userId, s.id, ref, (s.templateTaskJson ?? {}) as Record<string, any>)
      created++
    }

    return { created, skipped, seriesChecked: series.length }
  }

  async materializeForAllUsers(referenceDate: Date = new Date()) {
    const users = await prisma.user.findMany({
      where: { recurringSeries: { some: {} } },
      select: { id: true },
    })
    let created = 0
    let skipped = 0
    let seriesChecked = 0
    const errors: string[] = []
    for (const u of users) {
      try {
        const r = await this.materializeForUser(u.id, referenceDate)
        created += r.created
        skipped += r.skipped
        seriesChecked += r.seriesChecked
      } catch (err) {
        errors.push(`${u.id}: ${(err as Error).message}`)
      }
    }
    return { users: users.length, created, skipped, seriesChecked, errors: errors.length ? errors : undefined }
  }
}

export const recurringService = new RecurringService()
