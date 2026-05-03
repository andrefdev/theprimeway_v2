import { useTranslation } from 'react-i18next'
import { SectionTabs } from '@/shared/components/SectionTabs'

export function RitualsNav() {
  const { t } = useTranslation('rituals')
  return (
    <SectionTabs
      basePath="/rituals"
      items={[
        { to: '/rituals', label: t('tabs.overview') },
        { to: '/rituals/daily-plan', label: t('tabs.dailyPlan') },
        { to: '/rituals/daily-shutdown', label: t('tabs.dailyShutdown') },
        { to: '/rituals/weekly-plan', label: t('tabs.weeklyPlan') },
        { to: '/rituals/weekly-review', label: t('tabs.weeklyReview') },
        { to: '/rituals/quarterly-review', label: t('tabs.quarterly') },
        { to: '/rituals/annual-review', label: t('tabs.annual') },
      ]}
    />
  )
}
