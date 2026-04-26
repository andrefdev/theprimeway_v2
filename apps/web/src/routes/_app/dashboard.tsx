import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { dashboardQueries } from '@/features/dashboard/queries'
import { DashboardStats } from '@/features/dashboard/components/DashboardStats'
import { OverdueTasksBanner } from '@/features/dashboard/components/OverdueTasksBanner'
import { DashboardQuickActions } from '@/features/dashboard/components/DashboardQuickActions'
import { TodayTasksList } from '@/features/dashboard/components/TodayTasksList'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { NextTaskCard } from '@/features/dashboard/components/NextTaskCard'
import { WeeklyPlanCard } from '@/features/ai/components/WeeklyPlanCard'
import { GamificationWidget } from '@/features/gamification/components/GamificationWidget'
import { GoalsSummaryCard } from '@/features/goals/components/GoalsSummaryCard'
import { FatigueSignal } from '@/features/fatigue/components/FatigueSignal'
import { format } from 'date-fns'
import { useLocale } from '@/i18n/useLocale'
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
        <DashboardStats summary={summary} loading={summaryQuery.isLoading} />
        <OverdueTasksBanner summary={summary} />
        <FatigueSignal />
        <NextTaskCard />
        <DashboardQuickActions />
        <TodayTasksList tasks={tasks} tasksQuery={tasksQuery} />
        <GoalsSummaryCard />
        <WeeklyPlanCard />
        <GamificationWidget />
      </div>
    </div>
  )
}
