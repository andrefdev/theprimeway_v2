import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { QuarterlyGoals } from '@/features/goals/components/QuarterlyGoals'
import { QuarterlyReviewCard } from '@/features/goals/components/QuarterlyReviewCard'
import { GoalsNav } from '@/features/goals/components/GoalsNav'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const Route = createFileRoute('/_app/goals/quarterly')({
  component: QuarterlyPage,
})

function QuarterlyPage() {
  const { t } = useTranslation('goals')
  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('tabQuarterly')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <QuarterlyReviewCard />
        <QuarterlyGoals />
      </div>
    </div>
  )
}
