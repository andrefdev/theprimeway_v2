/**
 * Goals Repository — translation layer over the unified Goal model.
 *
 * Legacy hierarchy mapping:
 *   - Vision        → prisma.vision (singleton per user)
 *   - ThreeYearGoal → prisma.goal { horizon: THREE_YEAR }, area encoded in description "[area:xxx] ..."
 *   - AnnualGoal    → prisma.goal { horizon: ONE_YEAR },   parentGoalId=three-year, targetDate→endsOn
 *   - QuarterlyGoal → prisma.goal { horizon: QUARTER },    periodKey="YYYY-QN", progress→visionContribution*100
 *   - WeeklyGoal    → prisma.goal { horizon: WEEK },       startsOn=weekStartDate, parentGoalId=quarterly,
 *                                                          legacy status encoded in description "[ws:planned] ..."
 *   - HealthSnapshots / Focus{Habit,Finance}Links → stubs until Phase 3.
 */
import { prisma } from '../lib/prisma'

type LegacyVision = {
  id: string
  userId: string
  title: string
  narrative: string | null
  status: string
  createdAt: Date | null
  updatedAt: Date | null
  threeYearGoals?: LegacyThreeYear[]
}

type LegacyThreeYear = {
  id: string
  userId: string | null
  visionId: string | null
  area: string
  title: string
  description: string | null
  createdAt: Date | null
  updatedAt: Date | null
  annualGoals?: LegacyAnnual[]
}

type LegacyAnnual = {
  id: string
  userId: string | null
  threeYearGoalId: string | null
  title: string
  description: string | null
  targetMetrics: unknown
  targetDate: Date | null
  progress: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

function encodeArea(area?: string, description?: string | null): string | null {
  if (!area) return description ?? null
  const desc = description ? ` ${description}` : ''
  return `[area:${area}]${desc}`
}

function decodeArea(description: string | null): { area: string; description: string | null } {
  if (!description) return { area: 'lifestyle', description: null }
  const m = description.match(/^\[area:([^\]]+)\]\s?(.*)$/)
  if (!m) return { area: 'lifestyle', description }
  return { area: m[1] ?? 'lifestyle', description: m[2] || null }
}

// ─── WeeklyGoal status encoding (preserves 4-state legacy in description) ────

type WStatus = 'planned' | 'in_progress' | 'completed' | 'canceled'

function encodeWStatus(status: WStatus, description?: string | null): string | null {
  const body = description ? ` ${description}` : ''
  return `[ws:${status}]${body}`
}

function decodeWStatus(description: string | null): { status: WStatus; description: string | null } {
  if (!description) return { status: 'planned', description: null }
  const m = description.match(/^\[ws:([^\]]+)\]\s?(.*)$/)
  if (!m) return { status: 'planned', description }
  const raw = (m[1] ?? 'planned') as WStatus
  return { status: raw, description: m[2] || null }
}

// ─── Period math ──────────────────────────────────────────────────────────────

function quarterBounds(year: number, quarter: number): { startsOn: Date; endsOn: Date; periodKey: string } {
  const startMonth = (quarter - 1) * 3 // 0,3,6,9
  const startsOn = new Date(Date.UTC(year, startMonth, 1))
  const endsOn = new Date(Date.UTC(year, startMonth + 3, 0))
  return { startsOn, endsOn, periodKey: `${year}-Q${quarter}` }
}

function parseQuarterKey(periodKey: string | null, startsOn: Date | null): { year: number; quarter: number } {
  const m = periodKey?.match(/^(\d{4})-Q([1-4])$/)
  if (m) return { year: Number(m[1]), quarter: Number(m[2]) }
  if (startsOn) {
    const y = startsOn.getUTCFullYear()
    const q = Math.floor(startsOn.getUTCMonth() / 3) + 1
    return { year: y, quarter: q }
  }
  const now = new Date()
  return { year: now.getUTCFullYear(), quarter: Math.floor(now.getUTCMonth() / 3) + 1 }
}

function isoWeekKey(d: Date): string {
  // ISO 8601 week number
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function toLegacyVision(v: any): LegacyVision {
  return {
    id: v.id,
    userId: v.userId,
    title: (v.statement?.split('\n')[0] || 'My Vision').slice(0, 200),
    narrative: v.statement ?? null,
    status: 'active',
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

function toLegacyThreeYear(g: any): LegacyThreeYear {
  const { area, description } = decodeArea(g.description)
  return {
    id: g.id,
    userId: g.userId,
    visionId: null,
    area,
    title: g.title,
    description,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }
}

function toLegacyAnnual(g: any): LegacyAnnual {
  return {
    id: g.id,
    userId: g.userId,
    threeYearGoalId: g.parentGoalId ?? null,
    title: g.title,
    description: g.description,
    targetMetrics: null,
    targetDate: g.endsOn,
    progress: Math.round((g.visionContribution ?? 0) * 100),
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════

class GoalsRepo {
  // ─── Visions (singleton) ────────────────────────────────────────────────────

  async findManyVisions(userId: string, _opts: { status?: string; search?: string; limit: number; offset: number }) {
    const v = await prisma.vision.findUnique({ where: { userId } })
    const data = v ? [toLegacyVision(v)] : []
    return { data, count: data.length }
  }

  async createVision(userId: string, data: { title: string; narrative?: string; status?: string }) {
    const v = await prisma.vision.upsert({
      where: { userId },
      update: { statement: data.narrative || data.title, lastReviewedAt: new Date() },
      create: { userId, statement: data.narrative || data.title, coreValues: [], identityStatements: [], lastReviewedAt: new Date() },
    })
    return toLegacyVision(v)
  }

  async updateVision(userId: string, _id: string, data: Record<string, unknown>) {
    const existing = await prisma.vision.findUnique({ where: { userId } })
    if (!existing) return null
    const v = await prisma.vision.update({
      where: { userId },
      data: { statement: (data.narrative as string) ?? (data.title as string) ?? existing.statement },
    })
    return toLegacyVision(v)
  }

  async deleteVision(userId: string, _id: string): Promise<boolean> {
    const existing = await prisma.vision.findUnique({ where: { userId } })
    if (!existing) return false
    await prisma.vision.delete({ where: { userId } })
    return true
  }

  // ─── Three Year Goals → Goal{horizon: THREE_YEAR} ───────────────────────────

  async findManyThreeYearGoals(userId: string, opts: { visionId?: string; area?: string; limit: number; offset: number }) {
    const where: any = { userId, horizon: 'THREE_YEAR' }
    const [rows, count] = await Promise.all([
      prisma.goal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.goal.count({ where }),
    ])
    let data = rows.map(toLegacyThreeYear)
    if (opts.area) data = data.filter((g: { area: string }) => g.area === opts.area)
    return { data, count }
  }

  async createThreeYearGoal(userId: string, data: { visionId: string; area: string; title: string; description?: string }) {
    const g = await prisma.goal.create({
      data: {
        userId,
        horizon: 'THREE_YEAR',
        title: data.title,
        description: encodeArea(data.area, data.description ?? null),
      },
    })
    return toLegacyThreeYear(g)
  }

  async updateThreeYearGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'THREE_YEAR' } })
    if (!existing) return null
    const decoded = decodeArea(existing.description)
    const newArea = (data.area as string) ?? decoded.area
    const newDesc = (data.description as string) ?? decoded.description ?? undefined
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: (data.title as string) ?? existing.title,
        description: encodeArea(newArea, newDesc ?? null),
      },
    })
    return toLegacyThreeYear(updated)
  }

  async deleteThreeYearGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'THREE_YEAR' } })
    if (!existing) return false
    await prisma.goal.delete({ where: { id } })
    return true
  }

  // ─── Annual Goals → Goal{horizon: ONE_YEAR} ─────────────────────────────────

  async findManyAnnualGoals(userId: string, opts: { threeYearGoalId?: string; limit: number; offset: number }) {
    const where: any = { userId, horizon: 'ONE_YEAR' }
    if (opts.threeYearGoalId) where.parentGoalId = opts.threeYearGoalId
    const [rows, count] = await Promise.all([
      prisma.goal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.goal.count({ where }),
    ])
    return { data: rows.map(toLegacyAnnual), count }
  }

  async createAnnualGoal(userId: string, data: { threeYearGoalId: string; title: string; description?: string; targetMetrics?: unknown; targetDate?: string }) {
    const g = await prisma.goal.create({
      data: {
        userId,
        horizon: 'ONE_YEAR',
        title: data.title,
        description: data.description,
        parentGoalId: data.threeYearGoalId || undefined,
        endsOn: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    })
    return toLegacyAnnual(g)
  }

  async updateAnnualGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'ONE_YEAR' } })
    if (!existing) return null
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: (data.title as string) ?? existing.title,
        description: data.description !== undefined ? (data.description as string | null) : existing.description,
        parentGoalId: (data.threeYearGoalId as string | undefined) ?? existing.parentGoalId,
        endsOn: data.targetDate !== undefined ? (data.targetDate ? new Date(data.targetDate as string) : null) : existing.endsOn,
        visionContribution: data.progress !== undefined ? Math.max(0, Math.min(1, (data.progress as number) / 100)) : existing.visionContribution,
      },
    })
    return toLegacyAnnual(updated)
  }

  async deleteAnnualGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'ONE_YEAR' } })
    if (!existing) return false
    await prisma.goal.delete({ where: { id } })
    return true
  }

  // ─── Quarterly Goals → Goal{horizon: QUARTER} ───────────────────────────────

  private toLegacyQuarterly = (g: any) => {
    const { year, quarter } = parseQuarterKey(g.periodKey, g.startsOn)
    return {
      id: g.id,
      userId: g.userId,
      year,
      quarter,
      title: g.title,
      objectives: (g.objectives ?? []) as unknown,
      startDate: g.startsOn,
      endDate: g.endsOn,
      progress: Math.round((g.visionContribution ?? 0) * 100),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }
  }

  async findManyQuarterlyGoals(userId: string, opts: { annualGoalId?: string; year?: number; quarter?: number; limit: number; offset: number }) {
    const where: any = { userId, horizon: 'QUARTER' }
    if (opts.year && opts.quarter) where.periodKey = `${opts.year}-Q${opts.quarter}`
    else if (opts.year) where.periodKey = { startsWith: `${opts.year}-Q` }
    const [rows, count] = await Promise.all([
      prisma.goal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.goal.count({ where }),
    ])
    const quarterlies = rows.map(this.toLegacyQuarterly)
    // Hydrate weeklyGoals for each quarterly (legacy shape)
    const ids = rows.map((r: { id: string }) => r.id)
    if (ids.length === 0) return { data: quarterlies, count }
    const weeklies = await prisma.goal.findMany({
      where: { userId, horizon: 'WEEK', parentGoalId: { in: ids } },
      orderBy: { createdAt: 'asc' },
    })
    const byParent = new Map<string, any[]>()
    for (const w of weeklies) {
      const k = w.parentGoalId ?? '__orphan__'
      if (!byParent.has(k)) byParent.set(k, [])
      byParent.get(k)!.push(this.toLegacyWeekly(w))
    }
    return { data: quarterlies.map((q: any) => ({ ...q, weeklyGoals: byParent.get(q.id) ?? [] })), count }
  }

  async createQuarterlyGoal(userId: string, data: { annualGoalId?: string; year: number; quarter: number; title: string; objectives?: unknown[]; startDate?: string; endDate?: string }) {
    const { startsOn, endsOn, periodKey } = quarterBounds(data.year, data.quarter)
    const g = await prisma.goal.create({
      data: {
        userId,
        horizon: 'QUARTER',
        title: data.title,
        objectives: (data.objectives ?? []) as import('@prisma/client').Prisma.InputJsonValue,
        startsOn: data.startDate ? new Date(data.startDate) : startsOn,
        endsOn: data.endDate ? new Date(data.endDate) : endsOn,
        periodKey,
        parentGoalId: data.annualGoalId || undefined,
      },
    })
    return this.toLegacyQuarterly(g)
  }

  async updateQuarterlyGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'QUARTER' } })
    if (!existing) return null
    const cur = parseQuarterKey(existing.periodKey, existing.startsOn)
    const year = (data.year as number | undefined) ?? cur.year
    const quarter = (data.quarter as number | undefined) ?? cur.quarter
    const updateData: Record<string, unknown> = {}
    if (data.year !== undefined || data.quarter !== undefined) {
      const b = quarterBounds(year, quarter)
      updateData.periodKey = b.periodKey
      if (data.startDate === undefined) updateData.startsOn = b.startsOn
      if (data.endDate === undefined) updateData.endsOn = b.endsOn
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.objectives !== undefined) updateData.objectives = data.objectives as import('@prisma/client').Prisma.InputJsonValue
    if (data.startDate !== undefined) updateData.startsOn = data.startDate ? new Date(data.startDate as string) : null
    if (data.endDate !== undefined) updateData.endsOn = data.endDate ? new Date(data.endDate as string) : null
    if (data.progress !== undefined) updateData.visionContribution = Math.max(0, Math.min(1, (data.progress as number) / 100))
    const updated = await prisma.goal.update({ where: { id }, data: updateData })
    return this.toLegacyQuarterly(updated)
  }

  async deleteQuarterlyGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'QUARTER' } })
    if (!existing) return false
    await prisma.goal.delete({ where: { id } })
    return true
  }

  // ─── Weekly Goals → Goal{horizon: WEEK} ─────────────────────────────────────

  private toLegacyWeekly = (g: any) => {
    const { status, description } = decodeWStatus(g.description)
    return {
      id: g.id,
      userId: g.userId,
      quarterlyGoalId: g.parentGoalId ?? null,
      weekStartDate: g.startsOn,
      title: g.title,
      description,
      status,
      order: 0,
      parentGoalId: null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }
  }

  async findManyWeeklyGoals(userId: string, opts: { quarterlyGoalId?: string; weekStartDate?: string; status?: string; limit: number; offset: number }) {
    const where: any = { userId, horizon: 'WEEK' }
    if (opts.quarterlyGoalId) where.parentGoalId = opts.quarterlyGoalId
    if (opts.weekStartDate) where.startsOn = new Date(opts.weekStartDate)
    const [rows, count] = await Promise.all([
      prisma.goal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.goal.count({ where }),
    ])
    let data = rows.map(this.toLegacyWeekly)
    if (opts.status) data = data.filter((w: { status: string }) => w.status === opts.status)
    return { data, count }
  }

  async createWeeklyGoal(userId: string, data: { quarterlyGoalId?: string; weekStartDate: string; title: string; status: string; description?: string }) {
    const weekStart = new Date(data.weekStartDate)
    const g = await prisma.goal.create({
      data: {
        userId,
        horizon: 'WEEK',
        title: data.title,
        description: encodeWStatus((data.status as WStatus) || 'planned', data.description ?? null),
        startsOn: weekStart,
        periodKey: isoWeekKey(weekStart),
        parentGoalId: data.quarterlyGoalId || undefined,
      },
    })
    return this.toLegacyWeekly(g)
  }

  async updateWeeklyGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'WEEK' } })
    if (!existing) return null
    const decoded = decodeWStatus(existing.description)
    const newStatus = (data.status as WStatus | undefined) ?? decoded.status
    const newDesc = data.description !== undefined ? (data.description as string | null) : decoded.description
    const updateData: Record<string, unknown> = {}
    if (data.quarterlyGoalId !== undefined) updateData.parentGoalId = (data.quarterlyGoalId as string | null) || null
    if (data.weekStartDate !== undefined) {
      const d = new Date(data.weekStartDate as string)
      updateData.startsOn = d
      updateData.periodKey = isoWeekKey(d)
    }
    if (data.title !== undefined) updateData.title = data.title
    if (data.status !== undefined || data.description !== undefined) {
      updateData.description = encodeWStatus(newStatus, newDesc ?? null)
    }
    const updated = await prisma.goal.update({ where: { id }, data: updateData })
    return this.toLegacyWeekly(updated)
  }

  async deleteWeeklyGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.goal.findFirst({ where: { id, userId, horizon: 'WEEK' } })
    if (!existing) return false
    await prisma.goal.delete({ where: { id } })
    return true
  }

  // ─── Health Snapshots — stubs (table dropped; reintroduce in Phase 2 if needed) ─

  async findManyHealthSnapshots(_quarterlyGoalId: string) {
    return [] as Array<{ id: string; quarterlyGoalId: string; weekStart: Date; momentumScore: number; status: string; createdAt: Date }>
  }

  async createHealthSnapshot(_userId: string, data: { quarterlyGoalId: string; weekStart: string; momentumScore: number; status: string }) {
    return {
      id: 'stub',
      quarterlyGoalId: data.quarterlyGoalId,
      weekStart: new Date(data.weekStart),
      momentumScore: data.momentumScore,
      status: data.status,
      createdAt: new Date(),
    }
  }

  // ─── Focus Links — Tasks (TaskGoal join table) ─────────────────────────────

  async findFocusTaskLinks(quarterlyGoalId: string) {
    const links = await prisma.taskGoal.findMany({
      where: { goalId: quarterlyGoalId },
      include: { task: true },
    })
    return links.map((l: any) => ({
      id: `${l.taskId}_${l.goalId}`,
      quarterlyGoalId: l.goalId,
      taskId: l.taskId,
      weight: 1,
      task: l.task,
      createdAt: l.createdAt,
    }))
  }

  async createFocusTaskLink(_userId: string, data: { quarterlyGoalId: string; taskId: string; weight?: number }) {
    return prisma.taskGoal.upsert({
      where: { taskId_goalId: { taskId: data.taskId, goalId: data.quarterlyGoalId } },
      update: {},
      create: { taskId: data.taskId, goalId: data.quarterlyGoalId },
    })
  }

  async deleteFocusTaskLink(_userId: string, id: string): Promise<boolean> {
    const [taskId, goalId] = id.split('_')
    if (!taskId || !goalId) return false
    try {
      await prisma.taskGoal.delete({ where: { taskId_goalId: { taskId, goalId } } })
      return true
    } catch {
      return false
    }
  }

  // ─── Focus Links — Habits & Finances — stubs ───────────────────────────────

  async findFocusHabitLinks(_quarterlyGoalId: string) {
    return [] as Array<{ id: string; quarterlyGoalId: string; habitId: string; weight: number; createdAt: Date }>
  }

  async createFocusHabitLink(_userId: string, data: { quarterlyGoalId: string; habitId: string; weight?: number }) {
    return {
      id: `${data.habitId}_${data.quarterlyGoalId}`,
      quarterlyGoalId: data.quarterlyGoalId,
      habitId: data.habitId,
      weight: data.weight ?? 1,
      createdAt: new Date(),
    }
  }

  async deleteFocusHabitLink(_userId: string, _id: string): Promise<boolean> {
    return true
  }

  async findFocusFinanceLinks(_quarterlyGoalId: string) {
    return [] as Array<unknown>
  }

  async createFocusFinanceLink(_userId: string, data: { quarterlyGoalId: string; savingsGoalId?: string; budgetId?: string; type: string; targetAmount?: number }) {
    return {
      id: `finance_${data.quarterlyGoalId}_${data.savingsGoalId ?? data.budgetId ?? 'none'}`,
      ...data,
      createdAt: new Date(),
    }
  }

  async deleteFocusFinanceLink(_userId: string, _id: string): Promise<boolean> {
    return true
  }

  // ─── Goal Tree — assemble nested tree from unified Goal + legacy Quarterly/Weekly ─

  async findGoalTree(userId: string, _filters?: { visionId?: string; threeYearId?: string }) {
    const [vision, allGoals, weeklyTaskLinks] = await Promise.all([
      prisma.vision.findUnique({ where: { userId } }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.taskGoal.findMany({
        where: { goal: { userId, horizon: 'WEEK' } },
        include: { task: true },
      }),
    ])

    const threeYears = allGoals.filter((g: any) => g.horizon === 'THREE_YEAR').map(toLegacyThreeYear)
    const annuals = allGoals.filter((g: any) => g.horizon === 'ONE_YEAR').map(toLegacyAnnual)
    const quarterlyRaw = allGoals.filter((g: any) => g.horizon === 'QUARTER')
    const weeklyRaw = allGoals.filter((g: any) => g.horizon === 'WEEK')

    const tasksByWeekly = new Map<string, any[]>()
    for (const link of weeklyTaskLinks) {
      if (!tasksByWeekly.has(link.goalId)) tasksByWeekly.set(link.goalId, [])
      tasksByWeekly.get(link.goalId)!.push(link.task)
    }

    const weeklies = weeklyRaw.map((w: any) => ({
      ...this.toLegacyWeekly(w),
      tasks: tasksByWeekly.get(w.id) ?? [],
    }))
    const weeklyByParent = new Map<string, any[]>()
    for (const w of weeklies) {
      const k = w.quarterlyGoalId ?? '__orphan__'
      if (!weeklyByParent.has(k)) weeklyByParent.set(k, [])
      weeklyByParent.get(k)!.push(w)
    }

    const quarterlies = quarterlyRaw.map((q: any) => ({
      ...this.toLegacyQuarterly(q),
      weeklyGoals: weeklyByParent.get(q.id) ?? [],
    }))

    const annualsWithChildren = annuals.map((a: any) => ({ ...a, quarterlyGoals: quarterlies }))
    const threeYearsWithChildren = threeYears.map((t: any) => ({
      ...t,
      annualGoals: annualsWithChildren.filter((a: any) => a.threeYearGoalId === t.id),
    }))

    if (!vision) return []
    return [
      {
        ...toLegacyVision(vision),
        threeYearGoals: threeYearsWithChildren,
      },
    ]
  }
}

export const goalsRepository = new GoalsRepo()

// ─── Weekly alignment helper ─────────────────────────────────────────────────
export async function findCompletedTasksForAlignment(userId: string, weekStart: Date, weekEnd: Date) {
  return prisma.task.findMany({
    where: {
      userId,
      status: 'completed',
      completedAt: { gte: weekStart, lt: weekEnd },
    },
    select: { id: true, title: true, goalLinks: { select: { goalId: true }, take: 1 } },
  })
}
