import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import type { DashboardSummary } from '@repo/shared/types'

interface OverdueTasksBannerProps {
  summary?: DashboardSummary
}

export function OverdueTasksBanner({ summary }: OverdueTasksBannerProps) {
  const { t } = useTranslation('dashboard')

  if (!summary || summary.tasks.overdueCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">
        {t('overdueWarning', { count: summary.tasks.overdueCount })}
      </p>
      <Link to="/tasks/all" className="text-sm font-medium text-foreground hover:underline">
        {t('viewAllTasks')}
      </Link>
    </div>
  )
}
