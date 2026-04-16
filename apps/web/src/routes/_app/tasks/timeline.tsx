import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { TasksNav } from '@/features/tasks/components/TasksNav'
import { TaskTimelineView } from '@/features/tasks/components/TaskTimelineView'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_app/tasks/timeline')({
  component: TasksTimelinePage,
})

function TasksTimelinePage() {
  const { t } = useTranslation('tasks')

  return (
    <div>
      <SectionHeader sectionId="tasks" title={t('pageTitle')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <TasksNav />
        <TaskTimelineView />
      </div>
    </div>
  )
}
