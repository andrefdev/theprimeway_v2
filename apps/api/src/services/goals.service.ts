/**
 * Goals Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Business rules & validation
 * - NO Prisma queries, NO HTTP concerns
 */
import { goalsRepository } from '../repositories/goals.repo'
import { prisma } from '../lib/prisma'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class GoalsService {
  // ─── Goals (legacy) ─────────────────────────────────────────────────────────

  async listGoals(userId: string, opts: {
    status?: string; type?: string; search?: string; limit: number; offset: number
  }) {
    return goalsRepository.findManyGoals(userId, opts)
  }

  async getGoal(userId: string, id: string) {
    return goalsRepository.findGoalById(userId, id)
  }

  async createGoal(userId: string, input: {
    title: string; description?: string; deadline?: string;
    progress?: number; type?: string; status?: string; relatedTasks?: string[]
  }) {
    // Check goal limit
    const [subscription, usage] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.userUsageStat.findFirst({
        where: { userId },
      }),
    ])

    const plan = subscription?.plan
    if (plan) {
      validateLimit(FEATURES.GOALS_LIMIT, plan, usage?.currentGoals ?? 0)
    }

    return goalsRepository.createGoal(userId, {
      title: input.title,
      description: input.description,
      deadline: input.deadline,
      progress: input.progress ?? 0,
      type: input.type ?? 'short-term',
      status: input.status ?? 'in-progress',
      relatedTasks: input.relatedTasks,
    })
  }

  async updateGoal(userId: string, id: string, input: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.deadline !== undefined) data.deadline = input.deadline
    if (input.progress !== undefined) data.progress = input.progress
    if (input.type !== undefined) data.type = input.type
    if (input.status !== undefined) data.status = input.status
    if (input.relatedTasks !== undefined) data.relatedTasks = input.relatedTasks

    return goalsRepository.updateGoal(userId, id, data)
  }

  async deleteGoal(userId: string, id: string) {
    return goalsRepository.deleteGoal(userId, id)
  }

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
    return goalsRepository.updateQuarterlyGoal(userId, id, data)
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
    return goalsRepository.createWeeklyGoal(userId, {
      ...input,
      status: input.status ?? 'not-started',
    })
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

  // ─── Focus Links — Finances ─────────────────────────────────────────────────

  async listFocusFinanceLinks(quarterlyGoalId: string) {
    return goalsRepository.findFocusFinanceLinks(quarterlyGoalId)
  }

  async createFocusFinanceLink(userId: string, input: {
    quarterlyGoalId: string; savingsGoalId?: string; budgetId?: string;
    type: string; targetAmount?: number
  }) {
    return goalsRepository.createFocusFinanceLink(userId, input)
  }

  // ─── Goal Tree ──────────────────────────────────────────────────────────────

  async getGoalTree(userId: string, filters?: { visionId?: string; threeYearId?: string }) {
    return goalsRepository.findGoalTree(userId, filters)
  }

  async deleteFocusFinanceLink(userId: string, id: string) {
    return goalsRepository.deleteFocusFinanceLink(userId, id)
  }

  // ─── AI Methods ──────────────────────────────────────────────────────────────

  async suggestSubGoals(
    userId: string,
    goalId: string,
    type: 'three-year' | 'annual' | 'quarterly' | 'weekly',
  ): Promise<{ suggestions: Array<{ title: string; description: string }> }> {
    // Get the parent goal
    let parentGoal: any = null
    if (type === 'three-year') {
      parentGoal = await prisma.vision.findUnique({ where: { id: goalId } })
    } else if (type === 'annual') {
      parentGoal = await prisma.threeYearGoal.findUnique({ where: { id: goalId } })
    } else if (type === 'quarterly') {
      parentGoal = await prisma.annualGoal.findUnique({ where: { id: goalId } })
    } else {
      parentGoal = await prisma.quarterlyGoal.findUnique({ where: { id: goalId } })
    }

    if (!parentGoal || parentGoal.userId !== userId) {
      return { suggestions: [] }
    }

    // Get existing children to avoid duplicates
    let existingChildren: string[] = []
    if (type === 'three-year') {
      const threeYears = await prisma.threeYearGoal.findMany({
        where: { visionId: goalId },
        select: { title: true },
      })
      existingChildren = threeYears.map((g) => g.title)
    } else if (type === 'annual') {
      const annuals = await prisma.annualGoal.findMany({
        where: { threeYearGoalId: goalId },
        select: { title: true },
      })
      existingChildren = annuals.map((g) => g.title)
    } else if (type === 'quarterly') {
      const quarterlies = await prisma.quarterlyGoal.findMany({
        where: { annualGoalId: goalId },
        select: { title: true },
      })
      existingChildren = quarterlies.map((g) => g.title)
    } else {
      const weeklies = await prisma.weeklyGoal.findMany({
        where: { quarterlyGoalId: goalId },
        select: { title: true },
      })
      existingChildren = weeklies.map((g) => g.title)
    }

    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
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

    return result
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
    const quarterlyGoals = await prisma.quarterlyGoal.findMany({
      where: {
        userId,
        // Estimate quarter dates (simplified - in production would use proper date logic)
      },
      include: {
        weeklyGoals: {
          select: {
            status: true,
            progress: true,
          },
        },
      },
    })

    const goalSummaries = quarterlyGoals
      .map(
        (g) =>
          `- ${g.title}: ${g.progress || 0}% complete (${g.weeklyGoals.filter((w: any) => w.status === 'completed').length}/${g.weeklyGoals.length} weeks done)`,
      )
      .join('\n')

    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
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

    return result
  }
}

export const goalsService = new GoalsService()
