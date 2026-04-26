import { useTranslation } from 'react-i18next'
import { StatCard } from '@/shared/components/StatCard'
import type { DashboardSummary } from '../api'

interface DashboardStatsProps {
  summary?: DashboardSummary
  loading?: boolean
}

export function DashboardStats({ summary, loading }: DashboardStatsProps) {
  const { t } = useTranslation('dashboard')
  const isLoading = loading && !summary

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        title={t('tasksToday')}
        loading={isLoading}
        value={summary ? `${summary.tasks.todayCompleted}/${summary.tasks.todayTotal}` : '—'}
        subtitle={
          summary?.tasks.todayTotal
            ? t('done', { percent: Math.round((summary.tasks.todayCompleted / summary.tasks.todayTotal) * 100) })
            : t('noTasks')
        }
        to="/tasks/today"
      />
      <StatCard
        title={t('habits')}
        loading={isLoading}
        value={summary ? `${summary.habits.completedToday}/${summary.habits.activeCount}` : '—'}
        subtitle={t('completedToday')}
        to="/habits"
      />
      <StatCard
        title={t('streak')}
        loading={isLoading}
        value={summary ? t('days', { count: summary.gamification.currentStreak }) : '—'}
        subtitle={t('keepItGoing')}
      />
    </div>
  )
}
