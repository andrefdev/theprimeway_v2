import { useTranslation } from 'react-i18next'
import { StatCard } from '../../../components/StatCard'
import { useLocale } from '../../../i18n/useLocale'
import { formatCurrency } from '../../../i18n/format'
import type { DashboardSummary } from '@repo/shared/types'

interface DashboardStatsProps {
  summary?: DashboardSummary
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const { t } = useTranslation('dashboard')
  const { locale } = useLocale()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        title={t('tasksToday')}
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
        value={summary ? `${summary.habits.completedToday}/${summary.habits.activeCount}` : '—'}
        subtitle={t('completedToday')}
        to="/habits"
      />
      <StatCard
        title={t('streak')}
        value={summary ? t('days', { count: summary.gamification.currentStreak }) : '—'}
        subtitle={t('keepItGoing')}
      />
      <StatCard
        title={t('finances')}
        value={summary ? formatCurrency(summary.finances.totalBalance, locale) : '—'}
        subtitle={summary ? t('accounts', { count: summary.finances.accountCount }) : ''}
        to="/finances"
      />
    </div>
  )
}
