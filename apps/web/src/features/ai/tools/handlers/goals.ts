import { toast } from 'sonner'
import { goalsApi } from '@/features/goals/api'
import { goalsQueries } from '@/features/goals/queries'
import type { ToolHandler } from '../types'

export type GoalLevel = 'three-year' | 'annual' | 'quarterly' | 'weekly' | 'three_year'

export interface CreateGoalArgs {
  level: GoalLevel
  title: string
  description?: string
  visionId?: string
  area?: string
  threeYearGoalId?: string
  annualGoalId?: string
  targetDate?: string
  year?: number
  quarter?: number
}

export interface UpdateGoalProgressArgs {
  level: 'annual' | 'quarterly'
  goalId: string
  progress: number
}

export interface DeleteGoalArgs {
  level: GoalLevel
  goalId: string
}

interface GoalLike {
  id: string
  title?: string
  name?: string
}

export const createGoalHandler: ToolHandler<CreateGoalArgs> = {
  name: 'createGoal',
  execute: async (args, { queryClient, t }) => {
    let goal: GoalLike
    if (args.level === 'three-year' || args.level === 'three_year') {
      if (!args.visionId) throw new Error('visionId required')
      goal = await goalsApi.createThreeYearGoal({
        visionId: args.visionId,
        area: args.area ?? 'lifestyle',
        title: args.title,
        description: args.description,
      })
    } else if (args.level === 'annual') {
      if (!args.threeYearGoalId) throw new Error('threeYearGoalId required')
      goal = await goalsApi.createAnnualGoal({
        threeYearGoalId: args.threeYearGoalId,
        title: args.title,
        description: args.description,
        targetDate: args.targetDate,
      })
    } else if (args.level === 'quarterly') {
      if (!args.annualGoalId || args.year == null || args.quarter == null) {
        throw new Error('annualGoalId, year, quarter required')
      }
      goal = await goalsApi.createQuarterlyGoal({
        annualGoalId: args.annualGoalId,
        year: args.year,
        quarter: args.quarter,
        title: args.title,
        description: args.description,
      })
    } else {
      throw new Error(`Unsupported goal level: ${args.level}`)
    }
    queryClient.invalidateQueries({ queryKey: goalsQueries.all() })
    toast.success(t('goalCreated', { ns: 'goals', defaultValue: 'Goal created' }))
    return {
      success: true,
      goal: { id: goal.id, title: goal.title ?? goal.name, level: args.level },
    }
  },
}

export const updateGoalProgressHandler: ToolHandler<UpdateGoalProgressArgs> = {
  name: 'updateGoalProgress',
  execute: async (args, { queryClient, t }) => {
    const goal =
      args.level === 'quarterly'
        ? await goalsApi.updateQuarterlyGoal(args.goalId, { progress: args.progress })
        : await goalsApi.updateAnnualGoal(args.goalId, { progress: args.progress })
    queryClient.invalidateQueries({ queryKey: goalsQueries.all() })
    toast.success(t('goalUpdated', { ns: 'goals', defaultValue: 'Goal updated' }))
    const g = goal as unknown as { id: string; progress: number }
    return { success: true, goal: { id: g.id, progress: g.progress, level: args.level } }
  },
}

export const deleteGoalHandler: ToolHandler<DeleteGoalArgs> = {
  name: 'deleteGoal',
  execute: async (args, { queryClient, t }) => {
    if (args.level === 'three-year' || args.level === 'three_year') {
      await goalsApi.deleteThreeYearGoal(args.goalId)
    } else if (args.level === 'annual') {
      await goalsApi.deleteAnnualGoal(args.goalId)
    } else if (args.level === 'quarterly') {
      await goalsApi.deleteQuarterlyGoal(args.goalId)
    } else if (args.level === 'weekly') {
      await goalsApi.deleteWeeklyGoal(args.goalId)
    } else {
      throw new Error(`Unknown goal level: ${args.level}`)
    }
    queryClient.invalidateQueries({ queryKey: goalsQueries.all() })
    toast.success(t('goalDeleted', { ns: 'goals', defaultValue: 'Goal deleted' }))
    return { success: true, level: args.level }
  },
}
