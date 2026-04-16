import { SectionTabs } from '@/shared/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function ReadingNav() {
  const { t } = useTranslation('reading')

  return (
    <SectionTabs
      basePath="/reading"
      items={[
        { to: '/reading', label: t('navExplore') },
        { to: '/reading/library', label: t('navLibrary') },
      ]}
    />
  )
}
