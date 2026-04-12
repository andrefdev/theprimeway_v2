/**
 * Goals Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries (findMany, create, update, delete)
 * - Returns Prisma objects directly (camelCase)
 * - NO business logic, NO HTTP concerns
 *
 * Sub-domains: Goals, Visions, Pillars, Outcomes, Focuses, Weekly Goals,
 *              Health Snapshots, Focus Links (Task, Habit, Finance)
 */
import { prisma } from '../lib/prisma'

// ═══════════════════════════════════════════════════════════════════════════════
// GOALS (legacy / simple goals)
// ═══════════════════════════════════════════════════════════════════════════════

class GoalsRepo {
  // ─── Goals ──────────────────────────────────────────────────────────────────

  async findManyGoals(userId: string, opts: {
    status?: string; type?: string; search?: string; limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.status) where.status = opts.status
    if (opts.type) where.type = opts.type
    if (opts.search) {
      where.OR = [
        { title: { contains: opts.search, mode: 'insensitive' } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ]
    }

    const [goals, count] = await Promise.all([
      prisma.goal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.goal.count({ where }),
    ])

    return { data: goals, count }
  }

  async findGoalById(userId: string, id: string) {
    return prisma.goal.findFirst({ where: { id, userId } })
  }

  async createGoal(userId: string, data: {
    title: string; description?: string; deadline?: string;
    progress: number; type: string; status: string; relatedTasks?: string[]
  }) {
    return prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        progress: data.progress,
        type: data.type,
        status: data.status,
        relatedTasks: data.relatedTasks ?? [],
      },
    })
  }

  async updateGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.goal.findFirst({ where: { id, userId } })
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline as string) : null
    if (data.progress !== undefined) updateData.progress = data.progress
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.relatedTasks !== undefined) updateData.relatedTasks = data.relatedTasks

    return prisma.goal.update({ where: { id }, data: updateData })
  }

  async deleteGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.goal.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.goal.delete({ where: { id } })
    return true
  }

  // ─── Visions ────────────────────────────────────────────────────────────────

  async findManyVisions(userId: string, opts: {
    status?: string; search?: string; limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.status) where.status = opts.status
    if (opts.search) {
      where.OR = [
        { title: { contains: opts.search, mode: 'insensitive' } },
        { narrative: { contains: opts.search, mode: 'insensitive' } },
      ]
    }

    const [visions, count] = await Promise.all([
      prisma.primeVision.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' }, include: { threeYearGoals: true } }),
      prisma.primeVision.count({ where }),
    ])

    return { data: visions, count }
  }

  async createVision(userId: string, data: { title: string; narrative?: string; status?: string }) {
    return prisma.primeVision.create({
      data: { userId, title: data.title, narrative: data.narrative, status: data.status },
    })
  }

  async updateVision(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.primeVision.findFirst({ where: { id, userId } })
    if (!existing) return null
    return prisma.primeVision.update({ where: { id }, data })
  }

  async deleteVision(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.primeVision.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.primeVision.delete({ where: { id } })
    return true
  }

  // ─── Three Year Goals ───────────────────────────────────────────────────────

  async findManyThreeYearGoals(userId: string, opts: {
    visionId?: string; area?: string; limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.visionId) where.visionId = opts.visionId
    if (opts.area) where.area = opts.area

    const [threeYearGoals, count] = await Promise.all([
      prisma.threeYearGoal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' }, include: { annualGoals: true } }),
      prisma.threeYearGoal.count({ where }),
    ])

    return { data: threeYearGoals, count }
  }

  async createThreeYearGoal(userId: string, data: {
    visionId: string; area: string; title: string; description?: string
  }) {
    return prisma.threeYearGoal.create({
      data: { userId, visionId: data.visionId, area: data.area as never, title: data.title, description: data.description },
    })
  }

  async updateThreeYearGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.threeYearGoal.findFirst({ where: { id, userId } })
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (data.visionId !== undefined) updateData.visionId = data.visionId
    if (data.area !== undefined) updateData.area = data.area
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description

    return prisma.threeYearGoal.update({ where: { id }, data: updateData })
  }

  async deleteThreeYearGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.threeYearGoal.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.threeYearGoal.delete({ where: { id } })
    return true
  }

  // ─── Annual Goals ───────────────────────────────────────────────────────────

  async findManyAnnualGoals(userId: string, opts: {
    threeYearGoalId?: string; limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.threeYearGoalId) where.threeYearGoalId = opts.threeYearGoalId

    const [annualGoals, count] = await Promise.all([
      prisma.annualGoal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.annualGoal.count({ where }),
    ])

    return { data: annualGoals, count }
  }

  async createAnnualGoal(userId: string, data: {
    threeYearGoalId: string; title: string; description?: string;
    targetMetrics?: unknown; targetDate?: string
  }) {
    return prisma.annualGoal.create({
      data: {
        userId,
        threeYearGoalId: data.threeYearGoalId,
        title: data.title,
        description: data.description,
        targetMetrics: data.targetMetrics as import('@prisma/client').Prisma.InputJsonValue | undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    })
  }

  async updateAnnualGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.annualGoal.findFirst({ where: { id, userId } })
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (data.threeYearGoalId !== undefined) updateData.threeYearGoalId = data.threeYearGoalId
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.targetMetrics !== undefined) updateData.targetMetrics = data.targetMetrics
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate as string) : null

    return prisma.annualGoal.update({ where: { id }, data: updateData })
  }

  async deleteAnnualGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.annualGoal.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.annualGoal.delete({ where: { id } })
    return true
  }

  // ─── Quarterly Goals ────────────────────────────────────────────────────────

  async findManyQuarterlyGoals(userId: string, opts: {
    annualGoalId?: string; year?: number; quarter?: number; limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.annualGoalId) where.annualGoalId = opts.annualGoalId
    if (opts.year) where.year = opts.year
    if (opts.quarter) where.quarter = opts.quarter

    const [quarterlyGoals, count] = await Promise.all([
      prisma.quarterlyGoal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' }, include: { weeklyGoals: true } }),
      prisma.quarterlyGoal.count({ where }),
    ])

    return { data: quarterlyGoals, count }
  }

  async createQuarterlyGoal(userId: string, data: {
    annualGoalId?: string; year: number; quarter: number; title: string;
    objectives?: unknown[]; startDate?: string; endDate?: string
  }) {
    return prisma.quarterlyGoal.create({
      data: {
        userId,
        annualGoalId: data.annualGoalId,
        year: data.year,
        quarter: data.quarter,
        title: data.title,
        objectives: (data.objectives ?? []) as import('@prisma/client').Prisma.InputJsonValue,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
  }

  async updateQuarterlyGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.quarterlyGoal.findFirst({ where: { id, userId } })
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (data.annualGoalId !== undefined) updateData.annualGoalId = data.annualGoalId
    if (data.year !== undefined) updateData.year = data.year
    if (data.quarter !== undefined) updateData.quarter = data.quarter
    if (data.title !== undefined) updateData.title = data.title
    if (data.objectives !== undefined) updateData.objectives = data.objectives
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate as string) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate as string) : null

    return prisma.quarterlyGoal.update({ where: { id }, data: updateData })
  }

  async deleteQuarterlyGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.quarterlyGoal.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.quarterlyGoal.delete({ where: { id } })
    return true
  }

  // ─── Weekly Goals ───────────────────────────────────────────────────────────

  async findManyWeeklyGoals(userId: string, opts: {
    quarterlyGoalId?: string; weekStartDate?: string; status?: string;
    limit: number; offset: number
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.quarterlyGoalId) where.quarterlyGoalId = opts.quarterlyGoalId
    if (opts.weekStartDate) where.weekStartDate = new Date(opts.weekStartDate)
    if (opts.status) where.status = opts.status

    const [goals, count] = await Promise.all([
      prisma.weeklyGoal.findMany({ where, take: opts.limit, skip: opts.offset, orderBy: { createdAt: 'desc' } }),
      prisma.weeklyGoal.count({ where }),
    ])

    return { data: goals, count }
  }

  async createWeeklyGoal(userId: string, data: {
    quarterlyGoalId?: string; weekStartDate: string; title: string; status: string
  }) {
    return prisma.weeklyGoal.create({
      data: {
        userId,
        quarterlyGoalId: data.quarterlyGoalId,
        weekStartDate: new Date(data.weekStartDate),
        title: data.title,
        status: data.status,
      },
    })
  }

  async updateWeeklyGoal(userId: string, id: string, data: Record<string, unknown>) {
    const existing = await prisma.weeklyGoal.findFirst({ where: { id, userId } })
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (data.quarterlyGoalId !== undefined) updateData.quarterlyGoalId = data.quarterlyGoalId
    if (data.weekStartDate !== undefined) updateData.weekStartDate = new Date(data.weekStartDate as string)
    if (data.title !== undefined) updateData.title = data.title
    if (data.status !== undefined) updateData.status = data.status

    return prisma.weeklyGoal.update({ where: { id }, data: updateData })
  }

  async deleteWeeklyGoal(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.weeklyGoal.findFirst({ where: { id, userId } })
    if (!existing) return false
    await prisma.weeklyGoal.delete({ where: { id } })
    return true
  }

  // ─── Health Snapshots ───────────────────────────────────────────────────────

  async findManyHealthSnapshots(quarterlyGoalId: string) {
    return prisma.goalHealthSnapshot.findMany({
      where: { quarterlyGoalId },
      orderBy: { weekStart: 'desc' },
    })
  }

  async createHealthSnapshot(userId: string, data: {
    quarterlyGoalId: string; weekStart: string; momentumScore: number; status: string
  }) {
    return prisma.goalHealthSnapshot.create({
      data: {
        userId,
        quarterlyGoalId: data.quarterlyGoalId,
        weekStart: new Date(data.weekStart),
        momentumScore: data.momentumScore,
        status: data.status,
      },
    })
  }

  // ─── Focus Links — Tasks ────────────────────────────────────────────────────

  async findFocusTaskLinks(quarterlyGoalId: string) {
    return prisma.focusTaskLink.findMany({
      where: { quarterlyGoalId },
      include: { task: true },
    })
  }

  async createFocusTaskLink(_userId: string, data: {
    quarterlyGoalId: string; taskId: string; weight?: number
  }) {
    return prisma.focusTaskLink.create({
      data: { quarterlyGoalId: data.quarterlyGoalId, taskId: data.taskId, weight: data.weight },
    })
  }

  async deleteFocusTaskLink(_userId: string, id: string): Promise<boolean> {
    const existing = await prisma.focusTaskLink.findFirst({ where: { id } })
    if (!existing) return false
    await prisma.focusTaskLink.delete({ where: { id } })
    return true
  }

  // ─── Focus Links — Habits ───────────────────────────────────────────────────

  async findFocusHabitLinks(quarterlyGoalId: string) {
    return prisma.focusHabitLink.findMany({
      where: { quarterlyGoalId },
      include: { habit: true },
    })
  }

  async createFocusHabitLink(_userId: string, data: {
    quarterlyGoalId: string; habitId: string; weight?: number
  }) {
    return prisma.focusHabitLink.create({
      data: { quarterlyGoalId: data.quarterlyGoalId, habitId: data.habitId, weight: data.weight },
    })
  }

  async deleteFocusHabitLink(_userId: string, id: string): Promise<boolean> {
    const existing = await prisma.focusHabitLink.findFirst({ where: { id } })
    if (!existing) return false
    await prisma.focusHabitLink.delete({ where: { id } })
    return true
  }

  // ─── Focus Links — Finances ─────────────────────────────────────────────────

  async findFocusFinanceLinks(quarterlyGoalId: string) {
    return prisma.focusFinanceLink.findMany({
      where: { quarterlyGoalId },
    })
  }

  async createFocusFinanceLink(_userId: string, data: {
    quarterlyGoalId: string; savingsGoalId?: string; budgetId?: string;
    type: string; targetAmount?: number
  }) {
    return prisma.focusFinanceLink.create({
      data: {
        quarterlyGoalId: data.quarterlyGoalId,
        savingsGoalId: data.savingsGoalId,
        budgetId: data.budgetId,
        type: data.type,
        targetAmount: data.targetAmount,
      },
    })
  }

  async deleteFocusFinanceLink(_userId: string, id: string): Promise<boolean> {
    const existing = await prisma.focusFinanceLink.findFirst({ where: { id } })
    if (!existing) return false
    await prisma.focusFinanceLink.delete({ where: { id } })
    return true
  }

  // ─── Goal Tree ──────────────────────────────────────────────────────────────

  async findGoalTree(userId: string, filters?: { visionId?: string; threeYearId?: string }) {
    return prisma.primeVision.findMany({
      where: {
        userId,
        ...(filters?.visionId ? { id: filters.visionId } : {}),
      },
      include: {
        threeYearGoals: {
          ...(filters?.threeYearId ? { where: { id: filters.threeYearId } } : {}),
          include: {
            annualGoals: {
              include: {
                quarterlyGoals: {
                  include: {
                    weeklyGoals: {
                      include: { tasks: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  }
}

export const goalsRepository = new GoalsRepo()
