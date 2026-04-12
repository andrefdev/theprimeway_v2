import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueries } from '../../features/dashboard/queries'
import { DashboardStats } from '../../features/dashboard/components/dashboard-stats'
import { OverdueTasksBanner } from '../../features/dashboard/components/overdue-tasks-banner'
import { DashboardQuickActions } from '../../features/dashboard/components/dashboard-quick-actions'
import { TodayTasksList } from '../../features/dashboard/components/today-tasks-list'
import { SectionHeader } from '../../components/section-header'
import { BriefingCard } from '../../features/ai/components/briefing-card'
import { GamificationWidget } from '../../features/gamification/components/gamification-widget'
import { format } from 'date-fns'
import { useLocale } from '../../i18n/useLocale'
import type { Task } from '@repo/shared/types'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const { dateFnsLocale } = useLocale()
  const today = format(new Date(), 'yyyy-MM-dd')

  const summaryQuery = useQuery(dashboardQueries.summary())
  const tasksQuery = useQuery(dashboardQueries.todayTasks(today))

  const summary = summaryQuery.data?.data
  const tasks: Task[] = tasksQuery.data?.data ?? []

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning')
    if (hour < 18) return t('goodAfternoon')
    return t('goodEvening')
  }

  return (
    <div>
      <SectionHeader
        sectionId="dashboard"
        title={`${getGreeting()}, ${t('welcomeBack')}`}
        description={format(new Date(), 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })}
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <DashboardStats summary={summary} />
        <OverdueTasksBanner summary={summary} />
        <DashboardQuickActions />
        <TodayTasksList tasks={tasks} tasksQuery={tasksQuery} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BriefingCard />
          <GamificationWidget />
        </div>
      </div>
    </div>
  )
}
