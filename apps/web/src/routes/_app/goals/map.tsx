import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { GoalsNav } from '@/features/goals/components/GoalsNav'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { VisionMap } from '@/features/vision/components/VisionMap'

export const Route = createFileRoute('/_app/goals/map')({
  component: MapPage,
})

function MapPage() {
  const { t } = useTranslation('goals')
  return (
    <div>
      <GoalsNav />
      <SectionHeader sectionId="goals" title={t('tabMap', { defaultValue: 'Map' })} />
      <div className="mx-auto max-w-6xl px-6 pb-6 space-y-6">
        <VisionMap />
      </div>
    </div>
  )
}
