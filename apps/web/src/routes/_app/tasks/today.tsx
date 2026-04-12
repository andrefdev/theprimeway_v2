import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries, useUpdateTask, useDeleteTask } from '../../../features/tasks/queries'
import { DayPlanner } from '../../../features/tasks/components/day-planner'
import { TaskDialog } from '../../../features/tasks/components/task-dialog'
import { QueryError } from '../../../components/query-error'
import { PlusIcon } from '../../../components/Icons'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/SectionHeader'
import { TasksNav } from '../../../features/tasks/components/tasks-nav'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../../../i18n/useLocale'
import type { Task } from '@repo/shared/types'

export const Route = createFileRoute('/_app/tasks/today')({
  component: TasksTodayPage,
})

function TasksTodayPage() {
  const { t } = useTranslation('tasks')
  const { dateFnsLocale } = useLocale()
  // Get today's date in local timezone (not UTC)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  console.log('📅 TasksTodayPage - today:', today, 'now:', now)
  const tasksQuery = useQuery(tasksQueries.today(today))
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const tasks = tasksQuery.data?.data ?? []
  const openTasks = tasks.filter((task: Task) => task.status === 'open')
  const completedTasks = tasks.filter((task: Task) => task.status === 'completed')

  function openCreate() {
    setEditingTask(null)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'completed' ? 'open' : 'completed'
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: newStatus } })
      toast.success(newStatus === 'completed' ? t('taskCompleted') : t('taskReopened'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  async function handleDelete(task: Task) {
    try {
      await deleteTask.mutateAsync(task.id)
      toast.success(t('taskDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  async function handleReorder(taskId: string, newStart: string, newEnd: string) {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { scheduledStart: newStart, scheduledEnd: newEnd },
      })
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  return (
    <div>
      <TasksNav />
      <SectionHeader
        sectionId="tasks"
        title={format(new Date(), 'EEEE, MMMM d', { locale: dateFnsLocale })}
        description={`${openTasks.length} ${t('open', { ns: 'common' })}, ${completedTasks.length} ${t('completed', { ns: 'common' })}`}
        actions={
          <Button onClick={() => openCreate()}>
            <PlusIcon /> {t('addTask')}
          </Button>
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {tasksQuery.isLoading && <SkeletonList lines={8} />}
        {tasksQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => tasksQuery.refetch()} />}

        {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length > 0 && (
          <DayPlanner
            tasks={tasks}
            date={today}
            onToggle={toggleTask}
            onEdit={openEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onQuickAdd={() => openCreate()}
          />
        )}

        {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 && (
          <EmptyState title={t('allDone')} description={t('noOpenTasks')} />
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null) }}
        task={editingTask}
        defaultDate={today}
      />
    </div>
  )
}
