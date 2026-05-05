import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { goalsApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'
import { listOps, patchQueries, rollbackQueries, snapshotQueries, type Snapshot } from '@/shared/lib/optimistic'
import { playSound } from '@/shared/lib/sound'

function maybePlayGoalCompleteSound(data: unknown): void {
  const d = data as { status?: string; completedAt?: string | null } | undefined
  if (!d) return
  if (d.status === 'completed' || (d.completedAt != null && d.completedAt !== '')) {
    playSound('goalComplete')
  }
}

interface GoalListResponse<T> { data: T[]; count: number }

async function optimisticListPatch<T extends { id: string }>(
  qc: QueryClient,
  matchKey: QueryKey,
  id: string,
  patch: Partial<T>,
): Promise<Snapshot<GoalListResponse<T>>> {
  const snaps = await snapshotQueries<GoalListResponse<T>>(qc, matchKey)
  patchQueries<GoalListResponse<T>>(qc, matchKey, (cur) => ({
    ...cur,
    data: listOps.patch(cur.data, id, patch),
  }))
  return snaps
}

async function optimisticListRemove<T extends { id: string }>(
  qc: QueryClient,
  matchKey: QueryKey,
  id: string,
): Promise<Snapshot<GoalListResponse<T>>> {
  const snaps = await snapshotQueries<GoalListResponse<T>>(qc, matchKey)
  patchQueries<GoalListResponse<T>>(qc, matchKey, (cur) => ({
    ...cur,
    data: listOps.remove(cur.data, id),
    count: Math.max(0, cur.count - 1),
  }))
  return snaps
}

// Variants for queries whose queryFn returns a plain array (e.g. weekly goals
// — see goalsQueries.weeklyGoals which unwraps `{data}` to `[]`). Using the
// list-shape helpers above on these queries crashes with `.map of undefined`.
async function optimisticArrayPatch<T extends { id: string }>(
  qc: QueryClient,
  matchKey: QueryKey,
  id: string,
  patch: Partial<T>,
): Promise<Snapshot<T[]>> {
  const snaps = await snapshotQueries<T[]>(qc, matchKey)
  patchQueries<T[]>(qc, matchKey, (cur) => (Array.isArray(cur) ? listOps.patch(cur, id, patch) : cur))
  return snaps
}

async function optimisticArrayRemove<T extends { id: string }>(
  qc: QueryClient,
  matchKey: QueryKey,
  id: string,
): Promise<Snapshot<T[]>> {
  const snaps = await snapshotQueries<T[]>(qc, matchKey)
  patchQueries<T[]>(qc, matchKey, (cur) => (Array.isArray(cur) ? listOps.remove(cur, id) : cur))
  return snaps
}

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

const visionsKey = () => [...goalsQueries.all(), 'visions'] as const

export function useUpdateVision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateVision>[1] }) =>
      goalsApi.updateVision(id, data),
    onMutate: ({ id, data }) => optimisticListPatch(qc, visionsKey(), id, data as any).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteVision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteVision(id),
    onMutate: (id) => optimisticListRemove(qc, visionsKey(), id).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
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

const threeYearKey = () => [...goalsQueries.all(), 'three-year'] as const

export function useUpdateThreeYearGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateThreeYearGoal>[1] }) =>
      goalsApi.updateThreeYearGoal(id, data),
    onMutate: ({ id, data }) => optimisticListPatch(qc, threeYearKey(), id, data as any).then((snaps) => ({ snaps })),
    onSuccess: (_res, vars) => maybePlayGoalCompleteSound(vars.data),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteThreeYearGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteThreeYearGoal(id),
    onMutate: (id) => optimisticListRemove(qc, threeYearKey(), id).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

const annualKey = () => [...goalsQueries.all(), 'annual'] as const

export function useUpdateAnnualGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateAnnualGoal>[1] }) =>
      goalsApi.updateAnnualGoal(id, data),
    onMutate: ({ id, data }) => optimisticListPatch(qc, annualKey(), id, data as any).then((snaps) => ({ snaps })),
    onSuccess: (_res, vars) => maybePlayGoalCompleteSound(vars.data),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteAnnualGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteAnnualGoal(id),
    onMutate: (id) => optimisticListRemove(qc, annualKey(), id).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateQuarterlyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createQuarterlyGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

const quarterlyKey = () => [...goalsQueries.all(), 'quarterly'] as const

export function useUpdateQuarterlyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateQuarterlyGoal>[1] }) =>
      goalsApi.updateQuarterlyGoal(id, data),
    onMutate: ({ id, data }) => optimisticListPatch(qc, quarterlyKey(), id, data as any).then((snaps) => ({ snaps })),
    onSuccess: (_res, vars) => maybePlayGoalCompleteSound(vars.data),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteQuarterlyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteQuarterlyGoal(id),
    onMutate: (id) => optimisticListRemove(qc, quarterlyKey(), id).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useCreateWeeklyGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: goalsApi.createWeeklyGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

const weeklyKey = () => [...goalsQueries.all(), 'weekly'] as const

export function useUpdateWeeklyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof goalsApi.updateWeeklyGoal>[1] }) =>
      goalsApi.updateWeeklyGoal(id, data),
    onMutate: ({ id, data }) => optimisticArrayPatch(qc, weeklyKey(), id, data as any).then((snaps) => ({ snaps })),
    onSuccess: (_res, vars) => maybePlayGoalCompleteSound(vars.data),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
  })
}

export function useDeleteWeeklyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteWeeklyGoal(id),
    onMutate: (id) => optimisticArrayRemove(qc, weeklyKey(), id).then((snaps) => ({ snaps })),
    onError: (_e, _v, ctx) => ctx?.snaps && rollbackQueries(qc, ctx.snaps),
    onSettled: () => qc.invalidateQueries({ queryKey: goalsQueries.all() }),
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
