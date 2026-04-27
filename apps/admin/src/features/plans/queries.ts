import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getFreePlan,
  type PlanInput,
} from './api'
import { queryClient } from '@/lib/query-client'

export const plansQueryKeys = {
  all: ['admin', 'plans'] as const,
  list: (includeInactive: boolean) => [...plansQueryKeys.all, 'list', includeInactive] as const,
  detail: (id: string) => [...plansQueryKeys.all, 'detail', id] as const,
}

export const plansQueries = {
  list: (includeInactive = false) =>
    queryOptions({
      queryKey: plansQueryKeys.list(includeInactive),
      queryFn: () => listPlans(includeInactive),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: plansQueryKeys.detail(id),
      queryFn: () => getPlan(id),
    }),
}

export function usePlans(includeInactive = false) {
  return useQuery(plansQueries.list(includeInactive))
}

export function usePlan(id: string) {
  return useQuery(plansQueries.detail(id))
}

function invalidateAll() {
  queryClient.invalidateQueries({ queryKey: plansQueryKeys.all })
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: (input: Partial<PlanInput>) => createPlan(input),
    onSuccess: invalidateAll,
  })
}

export function useUpdatePlan(id: string) {
  return useMutation({
    mutationFn: (input: Partial<PlanInput>) => updatePlan(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansQueryKeys.all })
    },
  })
}

export function useFreePlan() {
  return useQuery(
    queryOptions({
      queryKey: [...plansQueryKeys.all, 'free'] as const,
      queryFn: getFreePlan,
    }),
  )
}

export function useDeletePlan() {
  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) => deletePlan(id, hard),
    onSuccess: invalidateAll,
  })
}
