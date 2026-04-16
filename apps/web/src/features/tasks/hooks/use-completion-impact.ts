import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { tasksApi } from '../api'
import { toast } from 'sonner'

export function useCompletionImpact() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('tasks')

  const showImpact = useCallback(async (taskId: string) => {
    try {
      const impact = await tasksApi.getCompletionImpact(taskId)
      if (!impact) return

      const parts: string[] = []

      if (impact.xpAwarded > 0) {
        parts.push(`+${impact.xpAwarded} XP`)
      }

      if (impact.goalProgress) {
        const delta = impact.goalProgress.progress
        parts.push(`${impact.goalProgress.title}: ${delta}%`)
      }

      if (impact.todayStats) {
        parts.push(t('doneToday', { defaultValue: '{{count}} done today', count: impact.todayStats.tasksCompleted }))
      }

      if (impact.timeStats?.accuracy != null) {
        const acc = Math.round(impact.timeStats.accuracy * 100)
        parts.push(t('timeAccuracy', { defaultValue: 'Time accuracy: {{pct}}%', pct: acc }))
      }

      if (parts.length > 0) {
        toast.success(parts.join(' · '), { duration: 4000 })
      }

      // Refresh gamification profile for updated XP
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
    } catch {
      // Silent fail — impact toast is non-critical
    }
  }, [queryClient, t])

  return showImpact
}
