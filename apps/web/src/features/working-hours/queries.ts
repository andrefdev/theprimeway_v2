import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workingHoursApi, type WorkingHoursInput } from './api'

export const workingHoursKeys = {
  all: ['working-hours'] as const,
  scope: (channelId?: string | null) => ['working-hours', channelId ?? 'default'] as const,
}

export function useWorkingHours(channelId?: string | null) {
  return useQuery({
    queryKey: workingHoursKeys.scope(channelId),
    queryFn: () => workingHoursApi.list(channelId ?? null),
    staleTime: 30_000,
  })
}

export function useBulkReplaceWorkingHours(channelId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: WorkingHoursInput[]) => workingHoursApi.bulkReplace(rows, channelId ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workingHoursKeys.all })
    },
  })
}
