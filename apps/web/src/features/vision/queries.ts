import { useQuery } from '@tanstack/react-query'
import { visionApi } from './api'

export function useVision() {
  return useQuery({
    queryKey: ['vision'],
    queryFn: () => visionApi.get().then((r) => r.data),
  })
}
