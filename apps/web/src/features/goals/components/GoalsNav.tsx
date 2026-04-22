import { SectionTabs } from '@/shared/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function GoalsNav() {
  const { t } = useTranslation('goals')

  return (
    <SectionTabs
      basePath="/goals/mine"
      items={[
        { to: '/goals/mine', label: t('tabMyGoals') },
        { to: '/goals/tree', label: t('tabTree') },
        { to: '/goals/quarterly', label: t('tabQuarterly') },
        { to: '/goals/weekly', label: t('tabWeekly') },
        { to: '/goals/metrics', label: t('tabMetrics') },
      ]}
    />
  )
}
