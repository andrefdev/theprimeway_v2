/**
 * Goals Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Business rules & validation
 * - NO Prisma queries, NO HTTP concerns
 */
import { goalsRepository } from '../repositories/goals.repo'
import { gamificationEvents } from './gamification/events'
import { prisma } from '../lib/prisma'
import { generateObject } from 'ai'
import { taskModel } from '../lib/ai-models'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class GoalsService {
  // ─── Visions ────────────────────────────────────────────────────────────────

  async listVisions(userId: string, opts: {
    status?: string; search?: string; limit: number; offset: number
  }) {
    return goalsRepository.findManyVisions(userId, opts)
  }

  async createVision(userId: string, input: { title: string; narrative?: string; status?: string }) {
    return goalsRepository.createVision(userId, input)
  }

  async updateVision(userId: string, id: string, data: Record<string, unknown>) {
    return goalsRepository.updateVision(userId, id, data)
  }

  async deleteVision(userId: string, id: string) {
    return goalsRepository.deleteVision(userId, id)
  }

  // ─── Three Year Goals ───────────────────────────────────────────────────────

  async listThreeYearGoals(userId: string, opts: {
    visionId?: string; area?: string; limit: number; offset: number
  }) {
    return goalsRepository.findManyThreeYearGoals(userId, opts)
  }

  async createThreeYearGoal(userId: string, input: {
    visionId: string; area: string; title: string; description?: string
  }) {
    return goalsRepository.createThreeYearGoal(userId, input)
  }

  async updateThreeYearGoal(userId: string, id: string, data: Record<string, unknown>) {
    return goalsRepository.updateThreeYearGoal(userId, id, data)
  }

  async deleteThreeYearGoal(userId: string, id: string) {
    return goalsRepository.deleteThreeYearGoal(userId, id)
  }

  // ─── Annual Goals ───────────────────────────────────────────────────────────

  async listAnnualGoals(userId: string, opts: {
    threeYearGoalId?: string; limit: number; offset: number
  }) {
    return goalsRepository.findManyAnnualGoals(userId, opts)
  }

  async createAnnualGoal(userId: string, input: {
    threeYearGoalId: string; title: string; description?: string;
    targetMetrics?: unknown; targetDate?: string
  }) {
    return goalsRepository.createAnnualGoal(userId, input)
  }

  async updateAnnualGoal(userId: string, id: string, data: Record<string, unknown>) {
    return goalsRepository.updateAnnualGoal(userId, id, data)
  }

  async deleteAnnualGoal(userId: string, id: string) {
    return goalsRepository.deleteAnnualGoal(userId, id)
  }

  // ─── Quarterly Goals ────────────────────────────────────────────────────────

  async listQuarterlyGoals(userId: string, opts: {
    annualGoalId?: string; year?: number; quarter?: number; limit: number; offset: number
  }) {
    return goalsRepository.findManyQuarterlyGoals(userId, opts)
  }

  async createQuarterlyGoal(userId: string, input: {
    annualGoalId?: string; year: number; quarter: number; title: string;
    objectives?: unknown[]; startDate?: string; endDate?: string
  }) {
    return goalsRepository.createQuarterlyGoal(userId, input)
  }

  async updateQuarterlyGoal(userId: string, id: string, data: Record<string, unknown>) {
    const result = await goalsRepository.updateQuarterlyGoal(userId, id, data)
    // Check quarterly milestone achievements when progress changes
    if ('progress' in data) {
      gamificationEvents.emit('quarterly.progress.updated', { userId })
    }
    return result
  }

  async deleteQuarterlyGoal(userId: string, id: string) {
    return goalsRepository.deleteQuarterlyGoal(userId, id)
  }

  // ─── Weekly Goals ───────────────────────────────────────────────────────────

  async listWeeklyGoals(userId: string, opts: {
    quarterlyGoalId?: string; weekStartDate?: string; status?: string;
    limit: number; offset: number
  }) {
    return goalsRepository.findManyWeeklyGoals(userId, opts)
  }

  async createWeeklyGoal(userId: string, input: {
    quarterlyGoalId?: string; weekStartDate: string; title: string; status?: string
  }) {
    const result = await goalsRepository.createWeeklyGoal(userId, {
      ...input,
      status: input.status ?? 'not-started',
    })
    gamificationEvents.emit('goal.created', { userId })
    return result
  }

  async updateWeeklyGoal(userId: string, id: string, data: Record<string, unknown>) {
    return goalsRepository.updateWeeklyGoal(userId, id, data)
  }

  async deleteWeeklyGoal(userId: string, id: string) {
    return goalsRepository.deleteWeeklyGoal(userId, id)
  }

  // ─── Health Snapshots ───────────────────────────────────────────────────────

  async listHealthSnapshots(quarterlyGoalId: string) {
    return goalsRepository.findManyHealthSnapshots(quarterlyGoalId)
  }

  async createHealthSnapshot(userId: string, input: {
    quarterlyGoalId: string; weekStart: string; momentumScore: number; status: string
  }) {
    return goalsRepository.createHealthSnapshot(userId, input)
  }

  // ─── Focus Links — Tasks ────────────────────────────────────────────────────

  async listFocusTaskLinks(quarterlyGoalId: string) {
    return goalsRepository.findFocusTaskLinks(quarterlyGoalId)
  }

  async createFocusTaskLink(userId: string, input: {
    quarterlyGoalId: string; taskId: string; weight?: number
  }) {
    return goalsRepository.createFocusTaskLink(userId, input)
  }

  async deleteFocusTaskLink(userId: string, id: string) {
    return goalsRepository.deleteFocusTaskLink(userId, id)
  }

  // ─── Focus Links — Habits ───────────────────────────────────────────────────

  async listFocusHabitLinks(quarterlyGoalId: string) {
    return goalsRepository.findFocusHabitLinks(quarterlyGoalId)
  }

  async createFocusHabitLink(userId: string, input: {
    quarterlyGoalId: string; habitId: string; weight?: number
  }) {
    return goalsRepository.createFocusHabitLink(userId, input)
  }

  async deleteFocusHabitLink(userId: string, id: string) {
    return goalsRepository.deleteFocusHabitLink(userId, id)
  }

  // ─── Goal Tree ──────────────────────────────────────────────────────────────

  async getGoalTree(userId: string, filters?: { visionId?: string; threeYearId?: string }) {
    return goalsRepository.findGoalTree(userId, filters)
  }

  // ─── Dashboard Summary ──────────────────────────────────────────────────────

  async getDashboardSummary(userId: string) {
    const now = new Date()

    // Run all counts and queries in parallel
    const [
      visionCount,
      threeYearCount,
      annualGoals,
      quarterlyGoals,
      weeklyGoals,
    ] = await Promise.all([
      prisma.vision.findUnique({ where: { userId } }).then((v: any) => (v ? 1 : 0)),
      prisma.goal.count({ where: { userId, horizon: 'THREE_YEAR' } }),
      prisma.goal.findMany({
        where: { userId, horizon: 'ONE_YEAR' },
        select: { id: true, title: true, visionContribution: true, endsOn: true },
      }).then((rows: any[]) => rows.map((r: any) => ({ id: r.id, title: r.title, progress: Math.round((r.visionContribution ?? 0) * 100), targetDate: r.endsOn }))),
      prisma.goal.findMany({
        where: { userId, horizon: 'QUARTER' },
        select: { id: true, title: true, visionContribution: true, endsOn: true },
      }).then((rows: any[]) => rows.map((r: any) => ({ id: r.id, title: r.title, progress: Math.round((r.visionContribution ?? 0) * 100), endDate: r.endsOn }))),
      prisma.goal.findMany({
        where: { userId, horizon: 'WEEK' },
        select: { id: true, title: true, description: true, startsOn: true },
      }).then((rows: any[]) => rows.map((r: any) => {
        const m = (r.description ?? '').match(/^\[ws:([^\]]+)\]/)
        return { id: r.id, title: r.title, status: m ? m[1] : 'planned', weekStartDate: r.startsOn }
      })),
    ])

    // Helper: compute health from progress (>70%=green, 40-70%=yellow, <40%=red)
    const computeHealth = (progress: number): 'green' | 'yellow' | 'red' => {
      if (progress > 70) return 'green'
      if (progress >= 40) return 'yellow'
      return 'red'
    }

    // Helper: count health buckets for a list of progress values
    const healthBuckets = (progressValues: number[]) => {
      const buckets = { green: 0, yellow: 0, red: 0 }
      for (const p of progressValues) {
        buckets[computeHealth(p)]++
      }
      return buckets
    }

    // Helper: average
    const avg = (values: number[]) =>
      values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length)

    // Map weekly goal statuses to progress for health computation
    const weeklyProgressValues = weeklyGoals.map((wg: { status: string | null }) => {
      if (wg.status === 'completed') return 100
      if (wg.status === 'in_progress') return 50
      if (wg.status === 'canceled') return 0
      return 0 // planned
    })

    const annualProgressValues = annualGoals.map((g: { progress: number }) => g.progress ?? 0)
    const quarterlyProgressValues = quarterlyGoals.map((g: { progress: number }) => g.progress ?? 0)

    // Build per-level summaries
    const levels = {
      vision: {
        total: visionCount,
        avgProgress: 0, // Visions have no progress field
        health: { green: 0, yellow: 0, red: 0 },
      },
      threeYear: {
        total: threeYearCount,
        avgProgress: 0, // ThreeYearGoals have no progress field
        health: { green: 0, yellow: 0, red: 0 },
      },
      annual: {
        total: annualGoals.length,
        avgProgress: avg(annualProgressValues),
        health: healthBuckets(annualProgressValues),
      },
      quarterly: {
        total: quarterlyGoals.length,
        avgProgress: avg(quarterlyProgressValues),
        health: healthBuckets(quarterlyProgressValues),
      },
      weekly: {
        total: weeklyGoals.length,
        avgProgress: avg(weeklyProgressValues),
        health: healthBuckets(weeklyProgressValues),
      },
    }

    // Upcoming deadlines: next 5 goals with closest endDate/targetDate in the future
    type UpcomingGoal = { id: string; title: string; level: string; endDate: Date }
    const upcoming: UpcomingGoal[] = []

    for (const g of annualGoals) {
      if (g.targetDate && g.targetDate > now) {
        upcoming.push({ id: g.id, title: g.title, level: 'annual', endDate: g.targetDate })
      }
    }
    for (const g of quarterlyGoals) {
      if (g.endDate && g.endDate > now) {
        upcoming.push({ id: g.id, title: g.title, level: 'quarterly', endDate: g.endDate })
      }
    }

    upcoming.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    const upcomingDeadlines = upcoming.slice(0, 5).map((g) => ({
      id: g.id,
      title: g.title,
      level: g.level,
      endDate: g.endDate.toISOString(),
    }))

    // Recently completed: last 5 goals completed (progress=100 or status='completed')
    type CompletedGoal = { id: string; title: string; level: string; completedAt: Date }
    const completed: CompletedGoal[] = []

    for (const g of annualGoals) {
      if ((g.progress ?? 0) >= 100) {
        completed.push({ id: g.id, title: g.title, level: 'annual', completedAt: now })
      }
    }
    for (const g of quarterlyGoals) {
      if ((g.progress ?? 0) >= 100) {
        completed.push({ id: g.id, title: g.title, level: 'quarterly', completedAt: now })
      }
    }
    for (const g of weeklyGoals) {
      if (g.status === 'completed') {
        completed.push({ id: g.id, title: g.title, level: 'weekly', completedAt: g.weekStartDate })
      }
    }

    // Sort most recent first
    completed.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    const recentlyCompleted = completed.slice(0, 5).map((g) => ({
      id: g.id,
      title: g.title,
      level: g.level,
    }))

    return {
      levels,
      upcomingDeadlines,
      recentlyCompleted,
    }
  }

  // ─── AI Methods ──────────────────────────────────────────────────────────────

  async generateChildSuggestions(
    userId: string,
    goalId: string,
    goalLevel: string,
  ) {
    // Resolve the parent goal from the correct table
    type GoalRecord = { id: string; userId: string; title: string; description?: string | null }
    let parentGoal: GoalRecord | null = null

    switch (goalLevel) {
      case 'ThreeYearGoal': {
        const g = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'THREE_YEAR' } })
        if (g) parentGoal = { id: g.id, userId: g.userId, title: g.title, description: g.description }
        break
      }
      case 'AnnualGoal': {
        const g = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'ONE_YEAR' } })
        if (g) parentGoal = { id: g.id, userId: g.userId, title: g.title, description: g.description }
        break
      }
      case 'QuarterlyGoal': {
        const g = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'QUARTER' } })
        if (g) parentGoal = { id: g.id, userId: g.userId, title: g.title, description: g.description }
        break
      }
      case 'WeeklyGoal': {
        const g = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'WEEK' } })
        if (g) parentGoal = { id: g.id, userId: g.userId, title: g.title, description: g.description }
        break
      }
      default:
        throw new Error(`Unsupported goal level: ${goalLevel}`)
    }

    if (!parentGoal || parentGoal.userId !== userId) {
      throw new Error('Goal not found')
    }

    // Determine what children to suggest based on goal level
    const childConfig: Record<string, { types: Array<{ type: string; min: number; max: number }>; childLabel: string }> = {
      ThreeYearGoal: {
        types: [{ type: 'AnnualGoal', min: 2, max: 3 }],
        childLabel: 'annual goals',
      },
      AnnualGoal: {
        types: [{ type: 'QuarterlyGoal', min: 2, max: 4 }],
        childLabel: 'quarterly goals',
      },
      QuarterlyGoal: {
        types: [
          { type: 'WeeklyGoal', min: 3, max: 5 },
          { type: 'Habit', min: 1, max: 2 },
        ],
        childLabel: 'weekly goals and habits',
      },
      WeeklyGoal: {
        types: [{ type: 'Task', min: 2, max: 4 }],
        childLabel: 'tasks',
      },
    }

    const config = childConfig[goalLevel]
    if (!config) throw new Error(`No child config for level: ${goalLevel}`)

    // Build count instructions for the prompt
    const countInstructions = config.types
      .map((t) => `${t.min}-${t.max} items of type "${t.type}"`)
      .join(', and ')

    const suggestionSchema = z.object({
      suggestions: z.array(
        z.object({
          title: z.string().describe('Short, actionable title'),
          description: z.string().describe('One-sentence description of the goal/task/habit'),
          type: z.enum(['AnnualGoal', 'QuarterlyGoal', 'WeeklyGoal', 'Task', 'Habit']),
        }),
      ),
    })

    const result = await generateObject({
      model: taskModel,
      schema: suggestionSchema,
      prompt: `You are a personal productivity coach. A user has the following ${goalLevel}:

Title: "${parentGoal.title}"
${parentGoal.description ? `Description: "${parentGoal.description}"` : ''}

Suggest ${countInstructions} as children for this goal.
The children should be ${config.childLabel}.

Rules:
- Each suggestion must be specific and actionable
- Titles should be concise (under 60 characters)
- Descriptions should be a single clear sentence
- Ensure suggestions cover different aspects of the parent goal
- For habits, suggest daily or weekly recurring actions
- For tasks, suggest concrete deliverables with clear completion criteria`,
    })

    return result.object.suggestions
  }

  async detectInactiveGoals(userId: string, inactiveDays: number = 14) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - inactiveDays)

    // Find quarterly goals not updated recently (Goal{horizon: QUARTER})
    const quarterlyGoals = await prisma.goal.findMany({
      where: {
        userId,
        horizon: 'QUARTER',
        visionContribution: { lt: 1 },
      },
    })

    const inactive: Array<{
      goalId: string
      title: string
      progress: number
      lastActivity: string
      daysSinceActivity: number
      weeklyGoalCount: number
      urgency: 'high' | 'medium' | 'low'
    }> = []

    for (const qg of quarterlyGoals) {
      const weeklyChildren: any[] = await prisma.goal.findMany({
        where: { userId, horizon: 'WEEK', parentGoalId: qg.id },
        include: { taskLinks: { include: { task: { select: { updatedAt: true } } } } },
      })
      const hasRecentTask = weeklyChildren.some((wg: any) =>
        wg.taskLinks.some((l: any) => l.task.updatedAt && l.task.updatedAt >= cutoff),
      )
      const goalUpdatedRecently = qg.updatedAt >= cutoff
      const anyWeeklyUpdated = weeklyChildren.some((wg: any) => wg.updatedAt >= cutoff)

      if (!hasRecentTask && !goalUpdatedRecently && !anyWeeklyUpdated) {
        const daysSinceActivity = Math.floor((Date.now() - qg.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        inactive.push({
          goalId: qg.id,
          title: qg.title,
          progress: Math.round((qg.visionContribution ?? 0) * 100),
          lastActivity: qg.updatedAt.toISOString(),
          daysSinceActivity,
          weeklyGoalCount: weeklyChildren.length,
          urgency: daysSinceActivity > 30 ? 'high' : daysSinceActivity > 21 ? 'medium' : 'low',
        })
      }
    }

    // Also check annual goals (Goal{horizon: ONE_YEAR})
    const annualGoals = await prisma.goal.findMany({
      where: {
        userId,
        horizon: 'ONE_YEAR',
        updatedAt: { lt: cutoff },
      },
      select: { id: true, title: true, visionContribution: true, updatedAt: true },
    })

    for (const ag of annualGoals) {
      const daysSinceActivity = Math.floor((Date.now() - ag.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      inactive.push({
        goalId: ag.id,
        title: ag.title,
        progress: Math.round((ag.visionContribution ?? 0) * 100),
        lastActivity: ag.updatedAt.toISOString(),
        daysSinceActivity,
        weeklyGoalCount: 0,
        urgency: daysSinceActivity > 30 ? 'high' : daysSinceActivity > 21 ? 'medium' : 'low',
      })
    }

    // Sort by days inactive descending
    inactive.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)

    return {
      inactive,
      count: inactive.length,
      threshold: inactiveDays,
    }
  }

  async suggestSubGoals(
    userId: string,
    goalId: string,
    type: 'three-year' | 'annual' | 'quarterly' | 'weekly',
  ): Promise<{ suggestions: Array<{ title: string; description: string }> }> {
    // Get the parent goal
    let parentGoal: any = null
    if (type === 'three-year') {
      parentGoal = await prisma.vision.findUnique({ where: { userId } })
    } else if (type === 'annual') {
      parentGoal = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'THREE_YEAR' } })
    } else if (type === 'quarterly') {
      parentGoal = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'ONE_YEAR' } })
    } else {
      parentGoal = await prisma.goal.findFirst({ where: { id: goalId, horizon: 'QUARTER' } })
    }

    if (!parentGoal || (parentGoal.userId && parentGoal.userId !== userId)) {
      return { suggestions: [] }
    }

    // Get existing children to avoid duplicates
    let existingChildren: string[] = []
    if (type === 'three-year') {
      const rows = await prisma.goal.findMany({ where: { userId, horizon: 'THREE_YEAR' }, select: { title: true } })
      existingChildren = rows.map((g: { title: string }) => g.title)
    } else if (type === 'annual') {
      const rows = await prisma.goal.findMany({ where: { userId, horizon: 'ONE_YEAR', parentGoalId: goalId }, select: { title: true } })
      existingChildren = rows.map((g: { title: string }) => g.title)
    } else if (type === 'quarterly') {
      const rows = await prisma.goal.findMany({ where: { userId, horizon: 'QUARTER', parentGoalId: goalId }, select: { title: true } })
      existingChildren = rows.map((g: { title: string }) => g.title)
    } else {
      const rows = await prisma.goal.findMany({ where: { userId, horizon: 'WEEK', parentGoalId: goalId }, select: { title: true } })
      existingChildren = rows.map((g: { title: string }) => g.title)
    }

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        suggestions: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
        ),
      }),
      prompt: `
Generate 3 coherent ${type.replace('-', ' ')} goals for this parent goal:
Title: ${parentGoal.title}
${parentGoal.description ? `Description: ${parentGoal.description}` : ''}

Avoid these existing sub-goals: ${existingChildren.join(', ') || 'none'}

Make them specific, actionable, and aligned with the parent goal.
      `,
    })

    return result.object
  }

  async detectConflicts(userId: string) {
    // Get all active quarterly goals with their weekly children and open tasks
    const quarterlyGoals = await prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER' },
    })

    if (quarterlyGoals.length < 2) {
      return { conflicts: [], overcommitment: null, summary: 'Need at least 2 quarterly goals for conflict analysis' }
    }

    const goalSummaries = await Promise.all(quarterlyGoals.map(async (qg: any) => {
      const weeklyChildren: any[] = await prisma.goal.findMany({
        where: { userId, horizon: 'WEEK', parentGoalId: qg.id },
        include: { taskLinks: { include: { task: { select: { status: true } } } } },
      })
      const openTasks = weeklyChildren.reduce(
        (n: number, wg: any) => n + wg.taskLinks.filter((l: any) => l.task.status === 'open').length,
        0,
      )
      return {
        id: qg.id,
        title: qg.title,
        progress: Math.round((qg.visionContribution ?? 0) * 100),
        startDate: qg.startsOn?.toISOString().split('T')[0] || 'unknown',
        endDate: qg.endsOn?.toISOString().split('T')[0] || 'unknown',
        openTasks,
        weeklyGoalCount: weeklyChildren.length,
        objectives: qg.objectives,
      }
    }))

    // Get total open tasks for overcommitment check
    const totalOpenTasks = await prisma.task.count({ where: { userId, status: 'open', archivedAt: null } })

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        conflicts: z.array(z.object({
          goalIds: z.array(z.string()),
          goalTitles: z.array(z.string()),
          type: z.enum(['time_conflict', 'resource_conflict', 'priority_conflict', 'scope_overlap']),
          description: z.string(),
          severity: z.enum(['high', 'medium', 'low']),
          suggestion: z.string(),
        })),
        overcommitment: z.object({
          isOvercommitted: z.boolean(),
          totalOpenTasks: z.number(),
          activeGoals: z.number(),
          recommendation: z.string(),
        }).nullable(),
        summary: z.string(),
      }),
      prompt: `Analyze these quarterly goals for conflicts and overcommitment:

${goalSummaries.map((g: any) => `Goal: "${g.title}" (${g.progress}% done, ${g.startDate} to ${g.endDate})
  - ${g.weeklyGoalCount} weekly goals, ${g.openTasks} open tasks
  - Objectives: ${JSON.stringify(g.objectives || {})}`).join('\n\n')}

Total open tasks across all goals: ${totalOpenTasks}

Detect:
1. Time conflicts: goals with overlapping deadlines competing for same time
2. Resource conflicts: too many concurrent goals draining focus
3. Priority conflicts: goals that work against each other
4. Scope overlap: goals that duplicate effort
5. Overcommitment: if total load seems unsustainable (>15 open tasks, >4 active quarterly goals)

Be constructive — suggest how to resolve each conflict.`,
    })

    return result.object
  }

  async getQuarterlyReview(
    userId: string,
    quarter: 1 | 2 | 3 | 4,
    year: number,
  ): Promise<{
    summary: string
    topAchievements: string[]
    stuckAreas: string[]
    proposedFocuses: string[]
  }> {
    // Get all quarterly goals for the period
    const quarterlyGoals = await prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER', periodKey: `${year}-Q${quarter}` },
    })

    const goalSummaries = quarterlyGoals
      .map(
        (g: any) =>
          `- ${g.title}: ${Math.round((g.visionContribution ?? 0) * 100)}% complete`,
      )
      .join('\n')

    const result = await generateObject({
      model: taskModel,
      schema: z.object({
        summary: z.string().describe('Overall quarterly performance summary'),
        topAchievements: z.array(z.string()).describe('3-5 top achievements'),
        stuckAreas: z.array(z.string()).describe('2-3 areas needing attention'),
        proposedFocuses: z.array(z.string()).describe('3-4 recommended focus areas for next quarter'),
      }),
      prompt: `
Analyze this quarter's performance (Q${quarter} ${year}):

${goalSummaries || 'No goals tracked'}

Provide:
1. Overall summary
2. Top 3-5 achievements
3. 2-3 areas that need work
4. 3-4 recommended focus areas for next quarter
      `,
    })

    return result.object
  }

  /** Weekly alignment: % of completed tasks in the week that have at least one goal link. */
  async getWeeklyAlignment(userId: string, weekStartStr: string) {
    const { findCompletedTasksForAlignment } = await import('../repositories/goals.repo')
    const weekStart = new Date(`${weekStartStr.slice(0, 10)}T00:00:00.000Z`)
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
    const completed = await findCompletedTasksForAlignment(userId, weekStart, weekEnd)
    const total = completed.length
    const aligned = completed.filter((t: { goalLinks: unknown[] }) => t.goalLinks.length > 0).length
    const alignmentPct = total > 0 ? Math.round((aligned / total) * 100) : 0
    return {
      weekStart: weekStartStr,
      total,
      aligned,
      unaligned: total - aligned,
      alignmentPct,
      sampleUnaligned: completed
        .filter((t: { goalLinks: unknown[] }) => t.goalLinks.length === 0)
        .slice(0, 5)
        .map((t: { title: string }) => t.title),
    }
  }
}

export const goalsService = new GoalsService()
