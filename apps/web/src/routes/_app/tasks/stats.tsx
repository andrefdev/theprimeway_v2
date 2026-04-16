import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '@/components/SectionHeader'
import { TasksNav } from '../../../features/tasks/components/TasksNav'
import { TaskStatsPanel } from '../../../features/tasks/components/TaskStatsPanel'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_app/tasks/stats')({
  component: TasksStatsPage,
})

function TasksStatsPage() {
  const { t } = useTranslation('tasks')

  return (
    <div>
      <SectionHeader sectionId="tasks" title={t('pageTitle')} />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <TasksNav />
        <TaskStatsPanel />
      </div>
    </div>
  )
}
