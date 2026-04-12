import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'

export function useScheduleSuggestion(
  targetDate: string | undefined,
  estimatedDuration: number | undefined,
  preferredTime?: 'morning' | 'afternoon' | 'evening',
) {
  return useQuery(
    tasksQueries.scheduleSuggestion(
      targetDate || '',
      estimatedDuration || 0,
      preferredTime,
    ),
  )
}
