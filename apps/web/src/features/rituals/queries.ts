import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ritualsApi, type RitualStatus } from './api'

export const ritualsKeys = {
  today: ['rituals', 'today'] as const,
  week: ['rituals', 'week'] as const,
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
