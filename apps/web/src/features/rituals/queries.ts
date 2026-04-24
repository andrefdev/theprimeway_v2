import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ritualsApi, type RitualCreateInput, type RitualStatus } from './api'

export const ritualsKeys = {
  today: ['rituals', 'today'] as const,
  week: ['rituals', 'week'] as const,
  quarter: ['rituals', 'quarter'] as const,
  year: ['rituals', 'year'] as const,
  list: ['rituals', 'list'] as const,
}

export function useRitualsQuarter() {
  return useQuery({ queryKey: ritualsKeys.quarter, queryFn: ritualsApi.quarter, staleTime: 5 * 60_000 })
}

export function useRitualsYear() {
  return useQuery({ queryKey: ritualsKeys.year, queryFn: ritualsApi.year, staleTime: 10 * 60_000 })
}

export function useRitualsList() {
  return useQuery({ queryKey: ritualsKeys.list, queryFn: ritualsApi.list })
}

export function useCreateRitual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RitualCreateInput) => ritualsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ritualsKeys.list }),
  })
}

export function useUpdateRitual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RitualCreateInput> }) =>
      ritualsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ritualsKeys.list })
      qc.invalidateQueries({ queryKey: ritualsKeys.today })
      qc.invalidateQueries({ queryKey: ritualsKeys.week })
    },
  })
}

export function useDeleteRitual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ritualsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ritualsKeys.list }),
  })
}

export function useRitualsToday() {
  return useQuery({
    queryKey: ritualsKeys.today,
    queryFn: ritualsApi.today,
    staleTime: 30_000,
  })
}

export function useRitualsWeek() {
  return useQuery({
    queryKey: ritualsKeys.week,
    queryFn: ritualsApi.week,
    staleTime: 60_000,
  })
}

export function useUpdateRitualInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: RitualStatus; startedAt?: string; completedAt?: string; snapshot?: unknown } }) =>
      ritualsApi.updateInstance(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ritualsKeys.today })
      qc.invalidateQueries({ queryKey: ritualsKeys.week })
    },
  })
}

export function useAddReflection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { ritualInstanceId: string; promptKey: string; body: string; attachedGoalId?: string }) =>
      ritualsApi.addReflection(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ritualsKeys.today })
      qc.invalidateQueries({ queryKey: ritualsKeys.week })
    },
  })
}
