import { toast } from 'sonner'
import { schedulingApi } from '@/features/scheduling/api'
import { tasksQueries } from '@/features/tasks/queries'
import { calendarQueries } from '@/features/calendar/queries'
import type { ToolHandler } from '../types'

export interface AutoScheduleTaskArgs {
  taskId: string
  day: string
  preventSplit?: boolean
}

interface AutoScheduleResult {
  type?: string
  sessions?: unknown
  reason?: string
  options?: unknown
}

export const autoScheduleTaskHandler: ToolHandler<AutoScheduleTaskArgs> = {
  name: 'autoScheduleTask',
  execute: async (args, { queryClient, t }) => {
    const r = (await schedulingApi.autoSchedule({
      taskId: args.taskId,
      day: args.day,
      preventSplit: args.preventSplit,
    })) as AutoScheduleResult
    if (r.type === 'Success') {
      queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
      queryClient.invalidateQueries({ queryKey: calendarQueries.all() })
      toast.success(t('taskScheduled', { ns: 'tasks', defaultValue: 'Task scheduled' }))
      return { success: true, sessions: r.sessions }
    }
    toast.error(t('taskScheduleFailed', { ns: 'tasks', defaultValue: 'Could not schedule task' }))
    return { success: false, reason: r.reason, options: r.options }
  },
}
