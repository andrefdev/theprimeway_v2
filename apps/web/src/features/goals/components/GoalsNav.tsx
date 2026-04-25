import { SectionTabs } from '@/shared/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function GoalsNav() {
  const { t } = useTranslation('goals')

  return (
    <SectionTabs
      basePath="/goals/tree"
      items={[
        { to: '/goals/tree', label: t('tabTree') },
        { to: '/goals/mine', label: t('tabList', { defaultValue: 'List' }) },
        { to: '/goals/weekly', label: t('tabWeekly') },
        { to: '/goals/metrics', label: t('tabMetrics') },
      ]}
    />
  )
}
