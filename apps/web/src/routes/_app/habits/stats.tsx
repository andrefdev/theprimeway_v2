import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { HabitsNav } from '@/features/habits/components/HabitsNav'
import { HabitsStats } from '@/features/habits/components/HabitsStats'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const Route = createFileRoute('/_app/habits/stats')({
  component: HabitsStatsPage,
})

function HabitsStatsPage() {
  const { t } = useTranslation('habits')

  return (
    <div>
      <HabitsNav />
      <SectionHeader sectionId="habits" title={t('tabStats')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <HabitsStats />
      </div>
    </div>
  )
}
