import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  schedulingApi,
  type AutoScheduleInput,
  type DeconflictInput,
  type EarlyCompleteInput,
  type MoveSessionInput,
  type TimerStartInput,
} from './api'
import { workingSessionsApi, type WorkingSession } from './working-sessions-api'
import { calendarEventsApi } from './calendar-events-api'
import { listOps, patchQueries, rollbackQueries, snapshotQueries } from '@/shared/lib/optimistic'
import { api } from '@/shared/lib/api-client'

export interface WorkingHoursOverride {
  id: string
  date: string
  startTime: string
  endTime: string
}

export const schedulingKeys = {
  commands: ['scheduling', 'commands'] as const,
  sessions: ['working-sessions'] as const,
  sessionsDay: (day: string) => ['working-sessions', 'day', day] as const,
  sessionsRange: (from: string, to: string) => ['working-sessions', 'range', from, to] as const,
  eventsRange: (from: string, to: string) => ['calendar-events', 'range', from, to] as const,
  whOverride: (date: string) => ['working-hours-override', date] as const,
}

export function useWorkingHoursOverride(date: string) {
  return useQuery({
    queryKey: schedulingKeys.whOverride(date),
    queryFn: () =>
      api
        .get<{ data: WorkingHoursOverride | null }>(`/working-hours/overrides/${date}`)
        .then((r) => r.data.data),
    staleTime: 30_000,
  })
}

export function useUpsertWorkingHoursOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { date: string; startTime: string; endTime: string }) =>
      api
        .put<{ data: WorkingHoursOverride }>(`/working-hours/overrides/${input.date}`, {
          startTime: input.startTime,
          endTime: input.endTime,
        })
        .then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: schedulingKeys.whOverride(vars.date) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
    },
  })
}

export function useDeleteWorkingHoursOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => api.delete(`/working-hours/overrides/${date}`),
    onSuccess: (_data, date) => {
      qc.invalidateQueries({ queryKey: schedulingKeys.whOverride(date) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
    },
  })
}

export function useWorkingSessionsRange(from: string, to: string) {
  return useQuery({
    queryKey: schedulingKeys.sessionsRange(from, to),
    queryFn: () => workingSessionsApi.list({ from, to }),
    staleTime: 10_000,
  })
}

export function useCalendarEventsRange(from: string, to: string) {
  return useQuery({
    queryKey: schedulingKeys.eventsRange(from, to),
    queryFn: () => calendarEventsApi.list(from, to),
    staleTime: 30_000,
  })
}

export function useWorkingSessionsForDay(day: string) {
  return useQuery({
    queryKey: schedulingKeys.sessionsDay(day),
    queryFn: () =>
      workingSessionsApi.list({
        from: `${day}T00:00:00.000Z`,
        to: `${day}T23:59:59.999Z`,
      }),
    staleTime: 10_000,
  })
}

export function useDeleteWorkingSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workingSessionsApi.remove(id),
    onMutate: async (id) => {
      const snaps = await snapshotQueries<WorkingSession[]>(qc, schedulingKeys.sessions)
      patchQueries<WorkingSession[]>(qc, schedulingKeys.sessions, (cur) => listOps.remove(cur, id))
      return { snaps }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snaps) rollbackQueries(qc, ctx.snaps)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAutoSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AutoScheduleInput) => schedulingApi.autoSchedule(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useMoveSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MoveSessionInput) => schedulingApi.moveSession(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useDeconflict() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DeconflictInput) => schedulingApi.deconflict(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
    },
  })
}

export function useCompleteEarly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EarlyCompleteInput) => schedulingApi.completeEarly(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
    },
  })
}

export function useTimerStart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TimerStartInput) => schedulingApi.timerStart(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
    },
  })
}

export function useRecentCommands(limit = 20) {
  return useQuery({
    queryKey: [...schedulingKeys.commands, limit],
    queryFn: () => schedulingApi.listCommands(limit),
    staleTime: 5_000,
  })
}

export function useUndoCommand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schedulingApi.undoCommand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      qc.invalidateQueries({ queryKey: schedulingKeys.commands })
    },
  })
}
