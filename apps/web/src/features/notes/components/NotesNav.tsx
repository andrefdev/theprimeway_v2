import { SectionTabs } from '@/shared/components/SectionTabs'
import { useTranslation } from 'react-i18next'

export function NotesNav() {
  const { t } = useTranslation('notes')

  return (
    <SectionTabs
      basePath="/notes"
      items={[
        { to: '/notes', label: t('navNotes') },
        { to: '/notes/trash', label: t('navTrash') },
      ]}
    />
  )
}
