import { toast } from 'sonner'
import { habitsApi } from '@/features/habits/api'
import { habitsQueries } from '@/features/habits/queries'
import type { ToolHandler } from '../types'

type FrequencyType = 'daily' | 'week_days' | 'times_per_week'

export interface CreateHabitArgs {
  name: string
  description?: string
  frequencyType?: FrequencyType
  targetFrequency?: number
}

export interface UpdateHabitArgs {
  habitId: string
  name?: string
  description?: string
  targetFrequency?: number
  frequencyType?: FrequencyType
  isActive?: boolean
}

export interface LogHabitArgs {
  habitId: string
  notes?: string
}

export interface DeleteHabitArgs {
  habitId: string
}

export const createHabitHandler: ToolHandler<CreateHabitArgs> = {
  name: 'createHabit',
  execute: async (args, { queryClient, t }) => {
    const habit = await habitsApi.create({
      name: args.name,
      description: args.description,
      frequencyType: args.frequencyType ?? 'daily',
      targetFrequency: args.targetFrequency ?? 1,
    })
    queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    toast.success(t('habitCreated', { ns: 'habits', defaultValue: 'Habit created' }))
    return { success: true, habit: { id: habit.id, name: habit.name } }
  },
}

export const updateHabitHandler: ToolHandler<UpdateHabitArgs> = {
  name: 'updateHabit',
  execute: async (args, { queryClient, t }) => {
    const patch: Record<string, unknown> = {}
    for (const k of ['name', 'description', 'targetFrequency', 'frequencyType', 'isActive'] as const) {
      if (args[k] !== undefined) patch[k] = args[k]
    }
    const habit = await habitsApi.update(args.habitId, patch)
    queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    toast.success(t('habitUpdated', { ns: 'habits', defaultValue: 'Habit updated' }))
    return { success: true, habit: { id: habit.id } }
  },
}

export const logHabitHandler: ToolHandler<LogHabitArgs> = {
  name: 'logHabit',
  execute: async (args, { queryClient, t }) => {
    const today = new Date().toISOString().split('T')[0]!
    const log = await habitsApi.upsertLog(args.habitId, {
      date: today,
      completedCount: 1,
      notes: args.notes,
    })
    queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    toast.success(t('habitLogged', { ns: 'habits', defaultValue: 'Habit logged' }))
    return { success: true, log: { id: log.id } }
  },
}

export const deleteHabitHandler: ToolHandler<DeleteHabitArgs> = {
  name: 'deleteHabit',
  execute: async (args, { queryClient, t }) => {
    await habitsApi.delete(args.habitId)
    queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
    toast.success(t('habitDeleted', { ns: 'habits', defaultValue: 'Habit deleted' }))
    return { success: true }
  },
}
