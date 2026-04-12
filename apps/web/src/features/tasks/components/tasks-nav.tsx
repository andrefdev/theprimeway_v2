import { SectionTabs } from '@/components/section-tabs'
import { useTranslation } from 'react-i18next'

export function TasksNav() {
  const { t } = useTranslation('common')

  return (
    <SectionTabs
      basePath="/tasks/today"
      items={[
        { to: '/tasks/today', label: t('today') },
        { to: '/tasks/weekly', label: t('weekly') },
        { to: '/tasks/all', label: t('all') },
      ]}
    />
  )
}
