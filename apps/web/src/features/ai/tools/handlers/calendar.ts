import { toast } from 'sonner'
import { calendarApi } from '@/features/calendar/api'
import { calendarQueries } from '@/features/calendar/queries'
import { habitsQueries } from '@/features/habits/queries'
import type { ToolHandler, ToolResult } from '../types'

export interface CreateTimeBlockArgs {
  title: string
  date: string
  startTime: string
  endTime: string
  description?: string
  timeZone?: string
}

export interface CreateHabitBlockArgs {
  habitId: string
  habitName: string
  startTime: string
  endTime: string
  frequencyType: string
  weekDays?: string[]
  description?: string
}

const NO_GOOGLE_RE = /no_google_account|no_calendar|No Google Calendar/i

function noGoogleToast(t: ToolHandler['execute'] extends never ? never : Parameters<ToolHandler['execute']>[1]['t']) {
  toast.error(
    t('timeBlockNoGoogle', {
      ns: 'calendar',
      defaultValue: 'Connect Google Calendar in Settings → Integrations first',
    }),
  )
}

function extractErrMsg(e: unknown): string {
  if (typeof e !== 'object' || e === null) return ''
  const err = e as { response?: { data?: { error?: string } }; data?: { error?: string }; message?: string }
  return err.response?.data?.error ?? err.data?.error ?? err.message ?? ''
}

export const createTimeBlockHandler: ToolHandler<CreateTimeBlockArgs> = {
  name: 'createTimeBlock',
  execute: async (args, { queryClient, t }): Promise<ToolResult> => {
    try {
      const browserTz = args.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await calendarApi.createTimeBlock({
        title: args.title,
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        description: args.description,
        timeZone: browserTz,
      })
      queryClient.invalidateQueries({ queryKey: calendarQueries.all() })
      toast.success(t('timeBlockCreated', { ns: 'calendar', defaultValue: 'Time block scheduled' }))
      return { success: true, eventId: res.eventId }
    } catch (e) {
      const errMsg = extractErrMsg(e)
      if (NO_GOOGLE_RE.test(errMsg)) {
        noGoogleToast(t)
        return { error: 'no_google_account' }
      }
      throw e
    }
  },
}

export const createHabitBlockHandler: ToolHandler<CreateHabitBlockArgs> = {
  name: 'createHabitBlock',
  execute: async (args, { queryClient, t }): Promise<ToolResult> => {
    try {
      const res = await calendarApi.createHabitBlock({
        habitId: args.habitId,
        habitName: args.habitName,
        startTime: args.startTime,
        endTime: args.endTime,
        frequencyType: args.frequencyType,
        weekDays: args.weekDays,
        description: args.description,
      })
      queryClient.invalidateQueries({ queryKey: calendarQueries.all() })
      queryClient.invalidateQueries({ queryKey: habitsQueries.all() })
      toast.success(t('habitBlockCreated', { ns: 'calendar', defaultValue: 'Habit block scheduled' }))
      return { success: true, eventId: res.eventId }
    } catch (e) {
      const errMsg = extractErrMsg(e)
      if (NO_GOOGLE_RE.test(errMsg)) {
        noGoogleToast(t)
        return { error: 'no_google_account' }
      }
      throw e
    }
  },
}
