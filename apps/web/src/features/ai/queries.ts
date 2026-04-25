import { queryOptions } from '@tanstack/react-query'
import { aiApi } from './api'
import { CACHE_TIMES } from '@repo/shared/constants'

export const aiQueries = {
  all: () => ['ai'] as const,

  briefing: () =>
    queryOptions({
      queryKey: [...aiQueries.all(), 'briefing'],
      queryFn: () => aiApi.getBriefing(),
      staleTime: CACHE_TIMES.long,
    }),
}
