import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries, useUpdateTask, useDeleteTask } from '@/features/tasks/queries'
import { TaskDialog } from '@/features/tasks/components/TaskDialog'
import { TaskItem } from '@/shared/components/TaskItem'
import { QueryError } from '@/shared/components/QueryError'
import { FilterBar } from '@/shared/components/FilterBar'
import { PlusIcon } from '@/shared/components/Icons'
import { Button } from '@/shared/components/ui/button'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { TasksNav } from '@/features/tasks/components/TasksNav'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { toast } from 'sonner'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCompletionImpact } from '@/features/tasks/hooks/use-completion-impact'
import type { Task } from '@repo/shared/types'

export const Route = createFileRoute('/_app/tasks/backlog')({
  component: TasksBacklogPage,
})

function TasksBacklogPage() {
  const { t } = useTranslation('tasks')
  const backlogQuery = useQuery(tasksQueries.list({ filter: 'backlog' }))
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const showImpact = useCompletionImpact()

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const tasks: Task[] = backlogQuery.data?.data ?? []

  const filtered = useMemo(() => {
    if (!search) return tasks
    return tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
  }, [tasks, search])

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

  async function scheduleTask(task: Task, date: string) {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { scheduledDate: date },
      })
      toast.success(t('taskRescheduled'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div>
      <TasksNav />
      <SectionHeader
        sectionId="tasks"
        title={t('titleBacklog', { defaultValue: 'Backlog' })}
        description={t('backlogDescription', { defaultValue: '{{count}} unscheduled tasks', count: filtered.length })}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon /> {t('addTask')}
          </Button>
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-4">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder={t('searchPlaceholder')} />

        {backlogQuery.isLoading && <SkeletonList lines={6} />}
        {backlogQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => backlogQuery.refetch()} />}

        {!backlogQuery.isLoading && !backlogQuery.isError && (
          <>
            {filtered.length > 0 ? (
              <div className="space-y-1">
                {filtered.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <TaskItem
                        task={task}
                        onToggle={() => toggleTask(task)}
                        onEdit={() => openEdit(task)}
                        onDelete={() => handleDelete(task)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => scheduleTask(task, today)}
                    >
                      {t('scheduleToday', { defaultValue: 'Today' })}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('noBacklogTasks', { defaultValue: 'Backlog is empty' })}
                description={t('noBacklogDescription', { defaultValue: 'All tasks have been scheduled. Nice!' })}
              />
            )}
          </>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null) }}
        task={editingTask}
      />
    </div>
  )
}
