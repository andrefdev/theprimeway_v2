import { useQuery } from '@tanstack/react-query'
import { tasksQueries, useUpdateTask, useDeleteTask } from '@/features/tasks/queries'
import { DayPlanner } from '@/features/tasks/components/DayPlanner'
import { TaskDialog } from '@/features/tasks/components/TaskDialog'
import { QueryError } from '@/shared/components/QueryError'
import { PlusIcon } from '@/shared/components/Icons'
import { Button } from '@/shared/components/ui/button'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { TasksNav } from '@/features/tasks/components/TasksNav'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import { useCompletionImpact } from '@/features/tasks/hooks/use-completion-impact'
import type { Task } from '@repo/shared/types'

export function TasksToday() {
  const { t } = useTranslation('tasks')
  const { dateFnsLocale } = useLocale()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const tasksQuery = useQuery(tasksQueries.today(today))
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const showImpact = useCompletionImpact()

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
      if (newStatus === 'completed') {
        showImpact(task.id)
      } else {
        toast.success(t('taskReopened'))
      }
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

  async function handleArchive(task: Task) {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'archived' } })
      toast.success(t('taskArchived', { defaultValue: 'Task archived' }))
    } catch {
      toast.error(t('failedToUpdate'))
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
            onArchive={handleArchive}
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
