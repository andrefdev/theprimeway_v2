import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const goalsQueries = {
  all: () => ['goals'] as const,

  list: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'list', params],
      queryFn: () => goalsApi.list(params),
      staleTime: CACHE_TIMES.standard,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'detail', id],
      queryFn: () => goalsApi.get(id),
      staleTime: CACHE_TIMES.standard,
    }),

  tree: (params?: Record<string, string>) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'tree', params],
      queryFn: () => goalsApi.getGoalTree(params),
      staleTime: CACHE_TIMES.long,
    }),

  visions: () =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'visions'],
      queryFn: () => goalsApi.listVisions(),
      staleTime: CACHE_TIMES.long,
    }),

  threeYearGoals: (visionId?: string) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'three-year', visionId],
      queryFn: () => goalsApi.listThreeYearGoals(visionId ? { visionId } : undefined),
      staleTime: CACHE_TIMES.long,
    }),

  annualGoals: (threeYearGoalId?: string) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'annual', threeYearGoalId],
      queryFn: () => goalsApi.listAnnualGoals(threeYearGoalId ? { threeYearGoalId } : undefined),
      staleTime: CACHE_TIMES.long,
    }),

  quarterlyGoals: (params?: { year?: number; quarter?: number; annualGoalId?: string }) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'quarterly', params],
      queryFn: () => {
        const p: Record<string, string> = {}
        if (params?.year) p.year = String(params.year)
        if (params?.quarter) p.quarter = String(params.quarter)
        if (params?.annualGoalId) p.annualGoalId = params.annualGoalId
        return goalsApi.listQuarterlyGoals(Object.keys(p).length > 0 ? p : undefined)
      },
      staleTime: CACHE_TIMES.standard,
    }),

  weeklyGoals: (params?: { quarterlyGoalId?: string; weekStartDate?: string }) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'weekly', params],
      queryFn: () => {
        const p: Record<string, string> = {}
        if (params?.quarterlyGoalId) p.quarterlyGoalId = params.quarterlyGoalId
        if (params?.weekStartDate) p.weekStartDate = params.weekStartDate
        return goalsApi.listWeeklyGoals(Object.keys(p).length > 0 ? p : undefined)
      },
      staleTime: CACHE_TIMES.standard,
    }),

  focusLinks: (quarterlyGoalId: string) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'focus-links', quarterlyGoalId],
      queryFn: () => goalsApi.listFocusLinks(quarterlyGoalId),
      staleTime: CACHE_TIMES.standard,
      enabled: !!quarterlyGoalId,
    }),
}

export function useGoalDetail(goalId: string) {
  const detailQuery = useQuery(goalsQueries.detail(goalId))
  const visionsQuery = useQuery({
    ...goalsQueries.visions(),
    enabled: detailQuery.isError,
  })

  const visionsArray = Array.isArray(visionsQuery.data) ? visionsQuery.data : (visionsQuery.data as any)?.data
  const data = detailQuery.data || (detailQuery.isError && visionsArray?.find((v: any) => v.id === goalId))
  const goalType = detailQuery.data ? 'goal' : (data ? 'vision' : undefined)

  return {
    data,
    goalType: goalType as 'goal' | 'vision' | undefined,
    isLoading: detailQuery.isLoading || visionsQuery.isLoading,
    isError: detailQuery.isError && visionsQuery.isError,
  }
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.update>[1] }) =>
      goalsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateVision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createVision,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateThreeYearGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createThreeYearGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateAnnualGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createAnnualGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateThreeYearGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateThreeYearGoal>[1] }) =>
      goalsApi.updateThreeYearGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteThreeYearGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteThreeYearGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateAnnualGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateAnnualGoal>[1] }) =>
      goalsApi.updateAnnualGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteAnnualGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteAnnualGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateQuarterlyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createQuarterlyGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateQuarterlyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateQuarterlyGoal>[1] }) =>
      goalsApi.updateQuarterlyGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteQuarterlyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteQuarterlyGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateWeeklyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createWeeklyGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateWeeklyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateWeeklyGoal>[1] }) =>
      goalsApi.updateWeeklyGoal(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteWeeklyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteWeeklyGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useSuggestSubGoals() {
  return useMutation({
    mutationFn: ({ goalId, type }: { goalId: string; type: 'three-year' | 'annual' | 'quarterly' | 'weekly' }) =>
      goalsApi.suggestSubGoals(goalId, type),
  })
}

export function useGetQuarterlyReview() {
  return useMutation({
    mutationFn: ({ quarter, year }: { quarter: 1 | 2 | 3 | 4; year: number }) =>
      goalsApi.getQuarterlyReview(quarter, year),
  })
}
