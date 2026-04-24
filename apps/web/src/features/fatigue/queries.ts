import { useQuery } from '@tanstack/react-query'
import { fatigueApi } from './api'

export function useFatigueSignal(windowDays = 7) {
  return useQuery({
    queryKey: ['fatigue', windowDays],
    queryFn: () => fatigueApi.get(windowDays),
    staleTime: 5 * 60_000,
  })
}
