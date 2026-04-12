import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { format } from 'date-fns'
import { useMemo } from 'react'
import type { Task } from '@repo/shared/types'

export function useTaskStats() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const query = useQuery(tasksQueries.today(today))
  const tasks: Task[] = query.data?.data ?? []

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'open')
    const completed = tasks.filter((t) => t.status === 'completed')
    const totalEstimated = open.reduce((sum, t) => sum + (t.estimatedDuration ?? 0), 0)

    return {
      openCount: open.length,
      completedCount: completed.length,
      totalCount: tasks.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      totalEstimatedMinutes: totalEstimated,
    }
  }, [tasks])

  return {
    ...stats,
    isLoading: query.isLoading,
    tasks,
  }
}
