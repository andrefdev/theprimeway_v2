/**
 * Rituals service — CRUD, ensure-today/week, scoped AI (summary + suggest objectives),
 * snapshot persistence. All ritual surfaces call this, not prisma directly.
 */
import { prisma } from '../lib/prisma'
import {
  ritualsRepo,
  type InstancePatch,
  type RitualCreate,
  type RitualKind,
} from '../repositories/rituals.repo'
import { recurringService } from './recurring.service'
import {
  endOfLocalDayUtc,
  localDayOfWeek,
  localTimeToUtc,
  startOfLocalDayUtc,
} from '@repo/shared/utils'

// ---------------------------------------------------------------------------
// Template defaults
// ---------------------------------------------------------------------------

type DailyKind = 'DAILY_PLAN' | 'DAILY_SHUTDOWN'
type WeeklyKind = 'WEEKLY_PLAN' | 'WEEKLY_REVIEW'
type QuarterlyKind = 'QUARTERLY_REVIEW'
type AnnualKind = 'ANNUAL_REVIEW'

function expectedHorizonForRitual(kind: string | undefined): 'WEEK' | 'QUARTER' | 'ONE_YEAR' | null {
  switch (kind) {
    case 'WEEKLY_PLAN':
    case 'WEEKLY_REVIEW':
      return 'WEEK'
    case 'QUARTERLY_REVIEW':
      return 'QUARTER'
    case 'ANNUAL_REVIEW':
      return 'ONE_YEAR'
    default:
      return null
  }
}

const DAILY_DEFAULTS: Record<DailyKind, { name: string; time: 'plan' | 'end'; steps: unknown[] }> = {
  DAILY_PLAN: {
    name: 'Daily Plan',
    time: 'plan',
    steps: [
      { type: 'PROMPT', key: 'highlight', text: "What's today's highlight? The one thing that would make today a win." },
      { type: 'CONFIRM_TASKS' },
      { type: 'PLAN_DAY' },
    ],
  },
  DAILY_SHUTDOWN: {
    name: 'Daily Shutdown',
    time: 'end',
    steps: [
      { type: 'PROMPT', key: 'went_well', text: 'What went well today?' },
      { type: 'PROMPT', key: 'carry_over', text: 'Anything to carry over to tomorrow?' },
      { type: 'ROLLOVER_TASKS' },
    ],
  },
}

const QUARTERLY_DEFAULTS: Record<QuarterlyKind, { name: string; steps: unknown[] }> = {
  QUARTERLY_REVIEW: {
    name: 'Quarterly Review',
    steps: [
      { type: 'PROMPT', key: 'quarter_wins', text: 'What were your biggest wins this quarter?' },
      { type: 'PROMPT', key: 'quarter_lessons', text: 'What did you learn? What did not work?' },
      { type: 'PROMPT', key: 'retire_goals', text: 'Any 1-year or 3-year goals to retire or reframe?' },
      { type: 'PROMPT', key: 'next_quarter_focus', text: 'Pick 2–3 quarterly goals for the next quarter.' },
    ],
  },
}

const ANNUAL_DEFAULTS: Record<AnnualKind, { name: string; steps: unknown[] }> = {
  ANNUAL_REVIEW: {
    name: 'Annual Review',
    steps: [
      { type: 'PROMPT', key: 'year_highlights', text: 'Highlights of the year — what are you proud of?' },
      { type: 'PROMPT', key: 'year_lessons', text: 'What did you learn about yourself?' },
      { type: 'PROMPT', key: 'vision_checkin', text: 'Does your 10-year vision still feel true? Anything to update?' },
      { type: 'PROMPT', key: 'three_year_update', text: 'Update or retire 3-year goals based on what you learned.' },
      { type: 'PROMPT', key: 'next_year_theme', text: 'A one-sentence theme for the coming year.' },
    ],
  },
}

export const WEEKLY_DEFAULTS: Record<WeeklyKind, { name: string; dayOfWeek: number; time: string; steps: unknown[] }> = {
  WEEKLY_PLAN: {
    name: 'Weekly Plan',
    dayOfWeek: 1,
    time: '08:00',
    steps: [
      { type: 'PROMPT', key: 'vision_checkin', text: 'Any 1-year goal to retire or update?' },
      { type: 'PROMPT', key: 'weekly_objectives', text: 'Pick 3–5 objectives for this week.' },
    ],
  },
  WEEKLY_REVIEW: {
    name: 'Weekly Review',
    dayOfWeek: 5,
    time: '17:00',
    steps: [
      { type: 'PROMPT', key: 'wins', text: 'Your biggest wins this week.' },
      { type: 'PROMPT', key: 'lessons', text: "What didn't work? What will you change?" },
      { type: 'PROMPT', key: 'next_focus', text: 'One thing to focus on next week.' },
    ],
  },
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dayBounds(ref: Date = new Date(), tz: string = 'UTC') {
  return { start: startOfLocalDayUtc(ref, tz), end: endOfLocalDayUtc(ref, tz) }
}

function weekBounds(ref: Date = new Date(), tz: string = 'UTC') {
  const dow = localDayOfWeek(ref, tz)
  // Walk back to Monday using a 12:00 anchor so DST shifts can't cross day boundaries.
  const noonAnchor = new Date(ref.getTime() - ((dow + 6) % 7) * 24 * 60 * 60 * 1000)
  const start = startOfLocalDayUtc(noonAnchor, tz)
  const endAnchor = new Date(noonAnchor.getTime() + 7 * 24 * 60 * 60 * 1000)
  const end = startOfLocalDayUtc(endAnchor, tz)
  return { start, end }
}

function quarterBounds(ref: Date = new Date()) {
  const year = ref.getUTCFullYear()
  const qIndex = Math.floor(ref.getUTCMonth() / 3) // 0..3
  const start = new Date(Date.UTC(year, qIndex * 3, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, qIndex * 3 + 3, 1, 0, 0, 0, 0))
  return { start, end, year, quarter: (qIndex + 1) as 1 | 2 | 3 | 4 }
}

function yearBounds(ref: Date = new Date()) {
  const year = ref.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
  return { start, end, year }
}

const PERIOD_REVIEW_WINDOW_DAYS: Record<'QUARTERLY_REVIEW' | 'ANNUAL_REVIEW', number> = {
  QUARTERLY_REVIEW: 7,
  ANNUAL_REVIEW: 14,
}

function isPeriodReviewUnlocked(
  kind: RitualKind,
  scheduledFor: Date,
  now: Date = new Date(),
): boolean {
  if (kind !== 'QUARTERLY_REVIEW' && kind !== 'ANNUAL_REVIEW') return true
  const windowMs = PERIOD_REVIEW_WINDOW_DAYS[kind] * 24 * 60 * 60 * 1000
  return scheduledFor.getTime() - now.getTime() <= windowMs
}

function periodReviewUnlockAt(kind: 'QUARTERLY_REVIEW' | 'ANNUAL_REVIEW', scheduledFor: Date) {
  return new Date(scheduledFor.getTime() - PERIOD_REVIEW_WINDOW_DAYS[kind] * 24 * 60 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class RitualsService {
  // ── CRUD ─────────────────────────────────────────────
  listSystemTemplates() { return ritualsRepo.listSystemTemplates() }
  listForUser(userId: string) { return ritualsRepo.listForUser(userId) }
  create(userId: string, data: RitualCreate) { return ritualsRepo.createForUser(userId, data) }
  update(userId: string, id: string, data: Partial<RitualCreate>) { return ritualsRepo.updateForUser(id, userId, data) }
  delete(userId: string, id: string) { return ritualsRepo.deleteForUser(id, userId) }

  listInstances(userId: string) { return ritualsRepo.listInstancesForUser(userId) }
  createInstance(userId: string, data: { ritualId: string; scheduledFor: Date }) { return ritualsRepo.createInstance(userId, data) }

  async patchInstance(userId: string, id: string, data: InstancePatch) {
    if (data.status === 'COMPLETED') {
      const existing = await ritualsRepo.findInstanceByIdAndUser(id, userId)
      if (!existing) return { ok: false as const, reason: 'not_found' as const }
      const kind = existing.ritual.kind as RitualKind
      if ((kind === 'QUARTERLY_REVIEW' || kind === 'ANNUAL_REVIEW')
        && !isPeriodReviewUnlocked(kind, existing.scheduledFor)) {
        return {
          ok: false as const,
          reason: 'too_early' as const,
          unlocksAt: periodReviewUnlockAt(kind, existing.scheduledFor),
        }
      }
    }
    const row = await ritualsRepo.patchInstance(id, userId, data)
    if (!row) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const, instance: row }
  }

  async createReflection(userId: string, body: { ritualInstanceId: string; promptKey: string; body: string; attachedGoalId?: string }) {
    const instance = await ritualsRepo.findInstanceByIdAndUser(body.ritualInstanceId, userId)
    if (!instance) return { ok: false as const, reason: 'not_found' as const }
    if (body.attachedGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: body.attachedGoalId, userId },
        select: { horizon: true },
      })
      if (!goal) return { ok: false as const, reason: 'invalid_goal' as const }
      const kind = (instance as any).ritual?.kind as string | undefined
      const expected = expectedHorizonForRitual(kind)
      if (expected && goal.horizon !== expected) {
        return { ok: false as const, reason: 'horizon_mismatch' as const }
      }
    }
    return { ok: true as const, reflection: await ritualsRepo.createReflection(body) }
  }

  // ── Ensure-today ─────────────────────────────────────
  async today(userId: string) {
    // Opportunistic recurring materialization (idempotent; safe fire-and-forget).
    recurringService
      .materializeForUser(userId, new Date())
      .catch((err) => console.error('[RITUALS_TODAY] materialize failed', err))

    const tz = await this.getUserTz(userId)
    const planTemplate = await this.ensureDailyTemplate(userId, 'DAILY_PLAN', tz)
    const shutdownTemplate = await this.ensureDailyTemplate(userId, 'DAILY_SHUTDOWN', tz)

    const plan = await this.ensureDailyInstance(userId, planTemplate.id, planTemplate.scheduledTime, tz)
    const shutdown = await this.ensureDailyInstance(userId, shutdownTemplate.id, shutdownTemplate.scheduledTime, tz)

    const { start, end } = dayBounds(new Date(), tz)
    const pending = await ritualsRepo.findPendingDaily(userId, start, end)
    return { pending, plan, shutdown }
  }

  // ── Cron: ensure daily rituals + materialize recurring for all users ─
  async ensureDailyForAllUsers(referenceDate: Date = new Date()) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { tasks: { some: { updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } } },
          { rituals: { some: {} } },
        ],
      },
      select: { id: true },
    })
    let ensured = 0
    const errors: string[] = []
    for (const u of users) {
      try {
        const tz = await this.getUserTz(u.id)
        const planTemplate = await this.ensureDailyTemplate(u.id, 'DAILY_PLAN', tz)
        const shutdownTemplate = await this.ensureDailyTemplate(u.id, 'DAILY_SHUTDOWN', tz)
        await this.ensureDailyInstance(u.id, planTemplate.id, planTemplate.scheduledTime, tz, referenceDate)
        await this.ensureDailyInstance(u.id, shutdownTemplate.id, shutdownTemplate.scheduledTime, tz, referenceDate)
        ensured++
      } catch (err) {
        errors.push(`${u.id}: ${(err as Error).message}`)
      }
    }
    return { users: users.length, ensured, errors: errors.length ? errors : undefined }
  }

  // ── Ensure-week ──────────────────────────────────────
  async week(userId: string) {
    const tz = await this.getUserTz(userId)
    const planTemplate = await this.ensureWeeklyTemplate(userId, 'WEEKLY_PLAN')
    const reviewTemplate = await this.ensureWeeklyTemplate(userId, 'WEEKLY_REVIEW')

    const plan = await this.ensureWeeklyInstance(
      userId,
      planTemplate.id,
      WEEKLY_DEFAULTS.WEEKLY_PLAN.dayOfWeek,
      planTemplate.scheduledTime ?? WEEKLY_DEFAULTS.WEEKLY_PLAN.time,
      tz,
    )
    const review = await this.ensureWeeklyInstance(
      userId,
      reviewTemplate.id,
      WEEKLY_DEFAULTS.WEEKLY_REVIEW.dayOfWeek,
      reviewTemplate.scheduledTime ?? WEEKLY_DEFAULTS.WEEKLY_REVIEW.time,
      tz,
    )

    const { start, end } = weekBounds(new Date(), tz)
    const pending = await ritualsRepo.findPendingWeekly(userId, start, end)
    return { pending, plan, review }
  }

  // ── Ensure-quarter ───────────────────────────────────
  async quarter(userId: string) {
    const tz = await this.getUserTz(userId)
    const template = await this.ensureQuarterlyTemplate(userId)
    const { start, year, quarter } = quarterBounds()
    // Schedule the review on the last day of the quarter at 17:00 user-local.
    const lastDayNoonUtc = new Date(Date.UTC(year, (quarter - 1) * 3 + 3, 0, 12, 0, 0, 0))
    const endOfQuarter = localTimeToUtc(lastDayNoonUtc, '17:00', tz)
    const review = await this.ensureQuarterlyInstance(userId, template.id, start, endOfQuarter)
    return { review, periodKey: `${year}-Q${quarter}` }
  }

  // ── Ensure-year ──────────────────────────────────────
  async year(userId: string) {
    const tz = await this.getUserTz(userId)
    const template = await this.ensureAnnualTemplate(userId)
    const { start, year } = yearBounds()
    // Schedule on Dec 31 at 17:00 user-local.
    const dec31NoonUtc = new Date(Date.UTC(year, 11, 31, 12, 0, 0, 0))
    const endOfYear = localTimeToUtc(dec31NoonUtc, '17:00', tz)
    const review = await this.ensureAnnualInstance(userId, template.id, start, endOfYear)
    return { review, periodKey: `${year}` }
  }

  // ── Scoped AI ────────────────────────────────────────
  async aiSummary(userId: string, instanceId: string) {
    const instance = await ritualsRepo.findInstanceByIdAndUser(instanceId, userId)
    if (!instance) return { ok: false as const, reason: 'not_found' as const }

    const { generateObject } = await import('ai')
    const { z: zod } = await import('zod')
    const { taskModel } = await import('../lib/ai-models')

    const isWeekly = instance.ritual.kind === 'WEEKLY_REVIEW' || instance.ritual.kind === 'WEEKLY_PLAN'
    const tz = await this.getUserTz(userId)
    let windowStart = startOfLocalDayUtc(instance.scheduledFor, tz)
    if (isWeekly) {
      const dow = localDayOfWeek(instance.scheduledFor, tz)
      const noonAnchor = new Date(instance.scheduledFor.getTime() - ((dow + 6) % 7) * 24 * 60 * 60 * 1000)
      windowStart = startOfLocalDayUtc(noonAnchor, tz)
    }
    const windowEndAnchor = new Date(windowStart.getTime() + (isWeekly ? 7 : 1) * 24 * 60 * 60 * 1000)
    const windowEnd = startOfLocalDayUtc(windowEndAnchor, tz)

    const [completed, goalsTouched] = await Promise.all([
      ritualsRepo.findCompletedTasksInWindow(userId, windowStart, windowEnd),
      ritualsRepo.findGoalsTouchedInWindow(userId, windowStart, windowEnd),
    ])

    const aligned = completed.filter((t: any) => t.goalLinks.length > 0).length
    const total = completed.length
    const alignmentPct = total > 0 ? Math.round((aligned / total) * 100) : 0

    const reflectionsText = instance.reflections.map((r: any) => `[${r.promptKey}] ${r.body}`).join('\n')
    const completedList = completed
      .map((t: any) => `- ${t.title}${t.goalLinks[0]?.goal ? ` → ${t.goalLinks[0].goal.title}` : ''}`)
      .join('\n')
    const goalsList = goalsTouched.map((g: any) => `- [${g.horizon}] ${g.title} (${g.status})`).join('\n')

    const prompt = `You are an executive coach reviewing a ${isWeekly ? 'week' : 'day'} of work. Be concise, specific, and kind. No fluff.

REFLECTIONS from the user:
${reflectionsText || '(none)'}

COMPLETED TASKS (${total}, alignment: ${alignmentPct}%):
${completedList || '(none)'}

GOALS TOUCHED:
${goalsList || '(none)'}

Produce structured insights.`

    try {
      const result = await generateObject({
        model: taskModel,
        schema: zod.object({
          summary: zod.string().describe('2–3 sentence summary of the period'),
          highlights: zod.array(zod.string()).describe('Top wins, each one line'),
          blockers: zod.array(zod.string()).describe('What slowed things down'),
          suggestedNextFocus: zod.string().describe('One actionable focus for the next period'),
        }),
        prompt,
      })
      const payload = { ...result.object, alignmentPct, totalCompleted: total }
      const existing = (instance.snapshot ?? {}) as Record<string, unknown>
      await ritualsRepo.updateInstanceSnapshot(instance.id, {
        ...existing,
        aiSummary: payload,
        aiSummaryAt: new Date().toISOString(),
      })
      return { ok: true as const, payload }
    } catch (err) {
      console.error('[RITUAL_AI_SUMMARY]', err)
      return { ok: false as const, reason: 'ai_failed' as const, message: (err as Error).message }
    }
  }

  async suggestWeeklyObjectives(userId: string, instanceId?: string) {
    const { generateObject } = await import('ai')
    const { z: zod } = await import('zod')
    const { taskModel } = await import('../lib/ai-models')

    const tz = await this.getUserTz(userId)
    const now = new Date()
    const dow = localDayOfWeek(now, tz)
    const thisMondayAnchor = new Date(now.getTime() - ((dow + 6) % 7) * 24 * 60 * 60 * 1000)
    const lastWeekEnd = startOfLocalDayUtc(thisMondayAnchor, tz)
    const lastMondayAnchor = new Date(thisMondayAnchor.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekStart = startOfLocalDayUtc(lastMondayAnchor, tz)

    const [completedLastWeek, openUnscheduled, activeQuarter] = await Promise.all([
      ritualsRepo.findCompletedTasksInWindow(userId, lastWeekStart, lastWeekEnd, 40),
      ritualsRepo.findOpenBacklog(userId, 20),
      ritualsRepo.findActiveQuarterlyGoals(userId, 10),
    ])

    const prompt = `You are an executive coach helping plan the upcoming week. Propose 3–5 concrete weekly objectives. Each should be action-oriented, 1 line, achievable in 5 working days.

LAST WEEK — completed tasks:
${completedLastWeek.map((t: any) => `- ${t.title}${t.goalLinks[0]?.goal ? ` → ${t.goalLinks[0].goal.title}` : ''}`).join('\n') || '(nothing)'}

OPEN BACKLOG (unscheduled, top priority):
${openUnscheduled.map((t: any) => `- ${t.title}${t.dueDate ? ` [due ${t.dueDate.toISOString().slice(0, 10)}]` : ''}`).join('\n') || '(empty)'}

ACTIVE QUARTERLY GOALS:
${activeQuarter.map((g: any) => `- ${g.title} (${Math.round((g.visionContribution ?? 0) * 100)}% to target)`).join('\n') || '(none set)'}

Respond with 3–5 objectives that ladder up to the quarterly goals and address visible gaps.`

    try {
      const result = await generateObject({
        model: taskModel,
        schema: zod.object({
          objectives: zod.array(zod.string().min(3).max(140)).min(3).max(5).describe('Weekly objective titles'),
          rationale: zod.string().describe('One short paragraph explaining the pick'),
        }),
        prompt,
      })

      if (instanceId) {
        const inst = await ritualsRepo.findInstanceByIdAndUser(instanceId, userId)
        if (inst) {
          const existing = (inst.snapshot ?? {}) as Record<string, unknown>
          await ritualsRepo.updateInstanceSnapshot(inst.id, {
            ...existing,
            aiSuggestedObjectives: result.object,
            aiSuggestedAt: new Date().toISOString(),
          })
        }
      }
      return { ok: true as const, payload: result.object }
    } catch (err) {
      console.error('[RITUAL_AI_SUGGEST_OBJECTIVES]', err)
      return { ok: false as const, reason: 'ai_failed' as const, message: (err as Error).message }
    }
  }

  // ── Private: ensure helpers ──────────────────────────
  private async getUserTz(userId: string): Promise<string> {
    const settings = await ritualsRepo.findUserSettings(userId)
    return settings?.timezone ?? 'UTC'
  }

  private async resolveDailyDefaultTime(userId: string, kind: DailyKind, tz: string): Promise<string> {
    // Use today's working hours (in user's tz) as the default when settings are blank.
    const dow = localDayOfWeek(new Date(), tz)
    const wh = await prisma.workingHours.findFirst({
      where: { userId, channelId: null, dayOfWeek: dow },
      select: { startTime: true, endTime: true },
    })
    if (kind === 'DAILY_PLAN') return wh?.startTime ?? '08:00'
    return wh?.endTime ?? '18:00'
  }

  private async ensureDailyTemplate(userId: string, kind: DailyKind, tz: string = 'UTC') {
    const existing =
      (await ritualsRepo.findEnabledByKind(userId, kind)) ??
      (await ritualsRepo.findEnabledByKind(null, kind))
    if (existing) return existing

    const settings = await ritualsRepo.findUserSettings(userId)
    const cfg = DAILY_DEFAULTS[kind]
    const explicit = cfg.time === 'plan' ? settings?.planDayAtTime : settings?.endDayAtTime
    const time = explicit ?? (await this.resolveDailyDefaultTime(userId, kind, tz))
    return ritualsRepo.createForUser(userId, {
      kind,
      name: cfg.name,
      cadence: 'DAILY',
      scheduledTime: time,
      steps: cfg.steps,
      isEnabled: true,
    })
  }

  private async ensureWeeklyTemplate(userId: string, kind: WeeklyKind) {
    const existing =
      (await ritualsRepo.findEnabledByKind(userId, kind)) ??
      (await ritualsRepo.findEnabledByKind(null, kind))
    if (existing) return existing

    const cfg = WEEKLY_DEFAULTS[kind]
    return ritualsRepo.createForUser(userId, {
      kind,
      name: cfg.name,
      cadence: 'WEEKLY',
      scheduledTime: cfg.time,
      steps: cfg.steps,
      isEnabled: true,
    })
  }

  private async ensureDailyInstance(
    userId: string,
    ritualId: string,
    scheduledTime: string | null,
    tz: string = 'UTC',
    ref: Date = new Date(),
  ) {
    const { start, end } = dayBounds(ref, tz)
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, { gte: start, lte: end })
    if (existing) return existing

    const scheduledFor = localTimeToUtc(ref, scheduledTime ?? '08:00', tz)
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }

  private async ensureQuarterlyTemplate(userId: string) {
    const existing =
      (await ritualsRepo.findEnabledByKind(userId, 'QUARTERLY_REVIEW')) ??
      (await ritualsRepo.findEnabledByKind(null, 'QUARTERLY_REVIEW'))
    if (existing) return existing
    const cfg = QUARTERLY_DEFAULTS.QUARTERLY_REVIEW
    return ritualsRepo.createForUser(userId, {
      kind: 'QUARTERLY_REVIEW',
      name: cfg.name,
      cadence: 'QUARTERLY',
      steps: cfg.steps,
      isEnabled: true,
    })
  }

  private async ensureAnnualTemplate(userId: string) {
    const existing =
      (await ritualsRepo.findEnabledByKind(userId, 'ANNUAL_REVIEW')) ??
      (await ritualsRepo.findEnabledByKind(null, 'ANNUAL_REVIEW'))
    if (existing) return existing
    const cfg = ANNUAL_DEFAULTS.ANNUAL_REVIEW
    return ritualsRepo.createForUser(userId, {
      kind: 'ANNUAL_REVIEW',
      name: cfg.name,
      cadence: 'ANNUALLY',
      steps: cfg.steps,
      isEnabled: true,
    })
  }

  private async ensureQuarterlyInstance(userId: string, ritualId: string, periodStart: Date, scheduledFor: Date) {
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, {
      gte: periodStart,
      lt: new Date(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 3, 1),
    })
    if (existing) return existing
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }

  private async ensureAnnualInstance(userId: string, ritualId: string, periodStart: Date, scheduledFor: Date) {
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, {
      gte: periodStart,
      lt: new Date(Date.UTC(periodStart.getUTCFullYear() + 1, 0, 1)),
    })
    if (existing) return existing
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }

  private async ensureWeeklyInstance(
    userId: string,
    ritualId: string,
    dayOfWeek: number,
    time: string,
    tz: string = 'UTC',
  ) {
    const { start, end } = weekBounds(new Date(), tz)
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, { gte: start, lt: end })
    if (existing) return existing

    // Anchor noon on the target weekday to avoid DST drift, then materialize local HH:mm.
    const offsetDays = (dayOfWeek + 6) % 7
    const noonAnchor = new Date(start.getTime() + offsetDays * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000)
    const scheduledFor = localTimeToUtc(noonAnchor, time, tz)
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }
}

export const ritualsService = new RitualsService()
export type { RitualKind }
