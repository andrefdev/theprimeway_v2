import { queryOptions } from '@tanstack/react-query'
import { dashboardApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: ['dashboard', 'summary'],
      queryFn: () => dashboardApi.getSummary(),
      staleTime: CACHE_TIMES.short,
    }),

  todayTasks: (referenceDate: string) =>
    queryOptions({
      queryKey: ['dashboard', 'tasks-today', referenceDate],
      queryFn: () => dashboardApi.getTodayTasks(referenceDate),
      staleTime: CACHE_TIMES.standard,
    }),
}
