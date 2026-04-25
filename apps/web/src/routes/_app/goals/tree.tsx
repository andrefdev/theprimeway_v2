import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { GoalTreeView } from '@/features/goals/components/GoalTreeView'
import { GoalsNav } from '@/features/goals/components/GoalsNav'
import { VisionEditor } from '@/features/vision/components/VisionEditor'
import { PeriodReviewAutoOpen } from '@/features/rituals/components/PeriodReviewAutoOpen'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const Route = createFileRoute('/_app/goals/tree')({
  component: TreePage,
})

function TreePage() {
  const { t } = useTranslation('goals')
  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('title')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <VisionEditor />
        <GoalTreeView />
      </div>
      <PeriodReviewAutoOpen />
    </div>
  )
}
