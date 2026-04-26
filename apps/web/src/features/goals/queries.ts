import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const goalsQueries = {
  all: () => ['goals'] as const,

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
      queryFn: async () => {
        const p: Record<string, string> = {}
        if (params?.quarterlyGoalId) p.quarterlyGoalId = params.quarterlyGoalId
        if (params?.weekStartDate) p.weekStartDate = params.weekStartDate
        const res: any = await goalsApi.listWeeklyGoals(Object.keys(p).length > 0 ? p : undefined)
        if (Array.isArray(res)) return res
        if (Array.isArray(res?.data)) return res.data
        return []
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

  conflicts: () =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'ai-conflicts'],
      queryFn: () => goalsApi.detectConflicts(),
      staleTime: CACHE_TIMES.long,
    }),

  inactive: (days?: number) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'ai-inactive', days],
      queryFn: () => goalsApi.detectInactive(days),
      staleTime: CACHE_TIMES.long,
    }),

  dashboardSummary: () =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'dashboard-summary'],
      queryFn: () => goalsApi.getDashboardSummary(),
      staleTime: CACHE_TIMES.standard,
    }),

  templates: (category?: string) =>
    queryOptions({
      queryKey: [...goalsQueries.all(), 'templates', category],
      queryFn: () => goalsApi.getTemplates(category),
      staleTime: CACHE_TIMES.long,
    }),
}

export function useGoalDetail(goalId: string) {
  const visionsQuery = useQuery(goalsQueries.visions())
  const threeYearQuery = useQuery(goalsQueries.threeYearGoals())
  const annualQuery = useQuery(goalsQueries.annualGoals())
  const quarterlyQuery = useQuery(goalsQueries.quarterlyGoals())

  const toArray = (d: unknown) => (Array.isArray(d) ? d : (d as any)?.data ?? [])

  const threeYearGoal = toArray(threeYearQuery.data).find((g: any) => g.id === goalId)
  const annualGoal = toArray(annualQuery.data).find((g: any) => g.id === goalId)
  const quarterlyGoal = toArray(quarterlyQuery.data).find((g: any) => g.id === goalId)
  const vision = toArray(visionsQuery.data).find((g: any) => g.id === goalId)

  const data = threeYearGoal || annualGoal || quarterlyGoal || vision || null
  const goalType = threeYearGoal
    ? 'three-year'
    : annualGoal
      ? 'annual'
      : quarterlyGoal
        ? 'quarterly'
        : vision
          ? 'vision'
          : undefined

  const isLoading =
    visionsQuery.isLoading || threeYearQuery.isLoading || annualQuery.isLoading || quarterlyQuery.isLoading

  return {
    data,
    goalType: goalType as 'three-year' | 'annual' | 'quarterly' | 'vision' | undefined,
    isLoading,
    isError: !isLoading && !data,
  }
}

export function useCreateVision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createVision,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useUpdateVision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateVision>[1] }) =>
      goalsApi.updateVision(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteVision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteVision(id),
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
