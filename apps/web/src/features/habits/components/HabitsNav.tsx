import { SectionTabs } from '@/shared/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function HabitsNav() {
  const { t } = useTranslation('habits')

  return (
    <SectionTabs
      basePath="/habits/tracker"
      items={[
        { to: '/habits/tracker', label: t('tabTracker') },
        { to: '/habits/list', label: t('tabList') },
        { to: '/habits/stats', label: t('tabStats') },
      ]}
    />
  )
}
