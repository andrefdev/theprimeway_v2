import { api } from '@/shared/lib/api-client'

export type SchedulingResult =
  | {
      type: 'Success'
      sessions: Array<{ id: string; start: string; end: string }>
      commandId: string
    }
  | {
      type: 'Overcommitted'
      reason: 'NO_WORKING_HOURS' | 'NO_GAPS' | 'WOULD_NOT_FIT'
      options: string[]
    }

export interface AutoScheduleInput {
  taskId: string
  /** yyyy-mm-dd */
  day: string
  preventSplit?: boolean
}

export interface DeconflictInput {
  sessionId: string
}

export interface EarlyCompleteInput {
  taskId: string
  completedAt?: string
}

export interface TimerStartInput {
  taskId: string
  startedAt?: string
}

export interface CommandRow {
  id: string
  userId: string
  type: string
  payload: unknown
  isUndone: boolean
  triggeredBy: string
  parentCommandId: string | null
  createdAt: string
}

export const schedulingApi = {
  autoSchedule: (input: AutoScheduleInput) =>
    api.post<{ data: SchedulingResult }>('/scheduling/auto-schedule', input).then((r) => r.data.data),

  deconflict: (input: DeconflictInput) =>
    api
      .post<{ data: { commandId: string; movedCount: number; orphanedCount: number } }>(
        '/scheduling/deconflict',
        input,
      )
      .then((r) => r.data.data),

  completeEarly: ({ taskId, completedAt }: EarlyCompleteInput) =>
    api
      .post<{ data: { commandId: string; truncated: boolean; shifted: number; skipped: number } | null }>(
        `/scheduling/tasks/${taskId}/complete-early`,
        completedAt ? { completedAt } : {},
      )
      .then((r) => r.data.data),

  timerStart: ({ taskId, startedAt }: TimerStartInput) =>
    api
      .post<{ data: unknown }>(
        `/scheduling/tasks/${taskId}/timer-start`,
        startedAt ? { startedAt } : {},
      )
      .then((r) => r.data.data),

  listCommands: (limit = 50) =>
    api.get<{ data: CommandRow[] }>(`/commands?limit=${limit}`).then((r) => r.data.data),

  undoCommand: (id: string) =>
    api.post<{ data: { undone: number } }>(`/commands/${id}/undo`, {}).then((r) => r.data.data),
}
