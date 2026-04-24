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

// ---------------------------------------------------------------------------
// Template defaults
// ---------------------------------------------------------------------------

type DailyKind = 'DAILY_PLAN' | 'DAILY_SHUTDOWN'
type WeeklyKind = 'WEEKLY_PLAN' | 'WEEKLY_REVIEW'

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

function dayBounds(ref: Date = new Date()) {
  const start = new Date(ref); start.setUTCHours(0, 0, 0, 0)
  const end = new Date(ref); end.setUTCHours(23, 59, 59, 999)
  return { start, end }
}

function weekBounds(ref: Date = new Date()) {
  const start = new Date(ref); start.setUTCHours(0, 0, 0, 0)
  const dow = start.getUTCDay()
  start.setUTCDate(start.getUTCDate() - ((dow + 6) % 7))
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7)
  return { start, end }
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
  patchInstance(userId: string, id: string, data: InstancePatch) { return ritualsRepo.patchInstance(id, userId, data) }

  async createReflection(userId: string, body: { ritualInstanceId: string; promptKey: string; body: string; attachedGoalId?: string }) {
    const instance = await ritualsRepo.findInstanceByIdAndUser(body.ritualInstanceId, userId)
    if (!instance) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const, reflection: await ritualsRepo.createReflection(body) }
  }

  // ── Ensure-today ─────────────────────────────────────
  async today(userId: string) {
    // Opportunistic recurring materialization (idempotent; safe fire-and-forget).
    recurringService
      .materializeForUser(userId, new Date())
      .catch((err) => console.error('[RITUALS_TODAY] materialize failed', err))

    const planTemplate = await this.ensureDailyTemplate(userId, 'DAILY_PLAN')
    const shutdownTemplate = await this.ensureDailyTemplate(userId, 'DAILY_SHUTDOWN')

    const plan = await this.ensureDailyInstance(userId, planTemplate.id, planTemplate.scheduledTime)
    const shutdown = await this.ensureDailyInstance(userId, shutdownTemplate.id, shutdownTemplate.scheduledTime)

    const { start, end } = dayBounds()
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
        const planTemplate = await this.ensureDailyTemplate(u.id, 'DAILY_PLAN')
        const shutdownTemplate = await this.ensureDailyTemplate(u.id, 'DAILY_SHUTDOWN')
        await this.ensureDailyInstance(u.id, planTemplate.id, planTemplate.scheduledTime, referenceDate)
        await this.ensureDailyInstance(u.id, shutdownTemplate.id, shutdownTemplate.scheduledTime, referenceDate)
        ensured++
      } catch (err) {
        errors.push(`${u.id}: ${(err as Error).message}`)
      }
    }
    return { users: users.length, ensured, errors: errors.length ? errors : undefined }
  }

  // ── Ensure-week ──────────────────────────────────────
  async week(userId: string) {
    const planTemplate = await this.ensureWeeklyTemplate(userId, 'WEEKLY_PLAN')
    const reviewTemplate = await this.ensureWeeklyTemplate(userId, 'WEEKLY_REVIEW')

    const plan = await this.ensureWeeklyInstance(
      userId,
      planTemplate.id,
      WEEKLY_DEFAULTS.WEEKLY_PLAN.dayOfWeek,
      planTemplate.scheduledTime ?? WEEKLY_DEFAULTS.WEEKLY_PLAN.time,
    )
    const review = await this.ensureWeeklyInstance(
      userId,
      reviewTemplate.id,
      WEEKLY_DEFAULTS.WEEKLY_REVIEW.dayOfWeek,
      reviewTemplate.scheduledTime ?? WEEKLY_DEFAULTS.WEEKLY_REVIEW.time,
    )

    const { start, end } = weekBounds()
    const pending = await ritualsRepo.findPendingWeekly(userId, start, end)
    return { pending, plan, review }
  }

  // ── Scoped AI ────────────────────────────────────────
  async aiSummary(userId: string, instanceId: string) {
    const instance = await ritualsRepo.findInstanceByIdAndUser(instanceId, userId)
    if (!instance) return { ok: false as const, reason: 'not_found' as const }

    const { generateObject } = await import('ai')
    const { z: zod } = await import('zod')
    const { taskModel } = await import('../lib/ai-models')

    const isWeekly = instance.ritual.kind === 'WEEKLY_REVIEW' || instance.ritual.kind === 'WEEKLY_PLAN'
    const windowStart = new Date(instance.scheduledFor)
    if (isWeekly) {
      windowStart.setUTCHours(0, 0, 0, 0)
      const dow = windowStart.getUTCDay()
      windowStart.setUTCDate(windowStart.getUTCDate() - ((dow + 6) % 7))
    } else {
      windowStart.setUTCHours(0, 0, 0, 0)
    }
    const windowEnd = new Date(windowStart)
    windowEnd.setUTCDate(windowEnd.getUTCDate() + (isWeekly ? 7 : 1))

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

    const now = new Date()
    const lastWeekEnd = new Date(now); lastWeekEnd.setUTCHours(0, 0, 0, 0)
    const dow = lastWeekEnd.getUTCDay()
    lastWeekEnd.setUTCDate(lastWeekEnd.getUTCDate() - ((dow + 6) % 7)) // this Monday
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7) // last Monday

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
  private async ensureDailyTemplate(userId: string, kind: DailyKind) {
    const existing =
      (await ritualsRepo.findEnabledByKind(userId, kind)) ??
      (await ritualsRepo.findEnabledByKind(null, kind))
    if (existing) return existing

    const settings = await ritualsRepo.findUserSettings(userId)
    const cfg = DAILY_DEFAULTS[kind]
    const time = cfg.time === 'plan' ? settings?.planDayAtTime ?? '08:00' : settings?.endDayAtTime ?? '18:00'
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

  private async ensureDailyInstance(userId: string, ritualId: string, scheduledTime: string | null, ref: Date = new Date()) {
    const { start, end } = dayBounds(ref)
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, { gte: start, lte: end })
    if (existing) return existing

    const [hh, mm] = (scheduledTime ?? '08:00').split(':').map(Number)
    const scheduledFor = new Date(start)
    scheduledFor.setUTCHours(hh ?? 8, mm ?? 0, 0, 0)
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }

  private async ensureWeeklyInstance(
    userId: string,
    ritualId: string,
    dayOfWeek: number,
    time: string,
  ) {
    const { start, end } = weekBounds()
    const existing = await ritualsRepo.findInstanceInRange(userId, ritualId, { gte: start, lt: end })
    if (existing) return existing

    const [hh, mm] = time.split(':').map(Number)
    const scheduledFor = new Date(start)
    scheduledFor.setUTCDate(start.getUTCDate() + ((dayOfWeek + 6) % 7))
    scheduledFor.setUTCHours(hh ?? 8, mm ?? 0, 0, 0)
    return ritualsRepo.createInstance(userId, { ritualId, scheduledFor })
  }
}

export const ritualsService = new RitualsService()
export type { RitualKind }
