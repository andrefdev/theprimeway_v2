import { toast } from 'sonner'
import { pomodoroApi } from '@/features/pomodoro/api'
import { pomodoroQueries } from '@/features/pomodoro/queries'
import type { ToolHandler } from '../types'

export interface StartPomodoroArgs {
  durationMinutes: number
  taskId?: string
}

export const startPomodoroHandler: ToolHandler<StartPomodoroArgs> = {
  name: 'startPomodoro',
  execute: async (args, { queryClient, t }) => {
    const session = await pomodoroApi.createSession({
      sessionType: 'focus',
      durationMinutes: args.durationMinutes,
      taskId: args.taskId,
      startedAt: new Date().toISOString(),
    })
    queryClient.invalidateQueries({ queryKey: pomodoroQueries.all() })
    toast.success(t('pomodoroStarted', { ns: 'pomodoro', defaultValue: 'Pomodoro started' }))
    const s = session as unknown as { id?: string; data?: { id: string } }
    return { success: true, sessionId: s.data?.id ?? s.id }
  },
}
