import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { WeeklyGoalsList } from '@/features/goals/components/WeeklyGoals'
import { GoalsNav } from '@/features/goals/components/GoalsNav'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const Route = createFileRoute('/_app/goals/weekly')({
  component: WeeklyPage,
})

function WeeklyPage() {
  const { t } = useTranslation('goals')
  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('tabWeekly')} />
      <div className="mx-auto max-w-5xl px-6 pb-6">
        <WeeklyGoalsList />
      </div>
    </div>
  )
}
