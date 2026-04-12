import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries, useUpdateTask, useDeleteTask } from '../../../features/tasks/queries'
import { TaskGroup } from '../../../features/tasks/components/TaskGroup'
import { ArchivePanel } from '../../../features/tasks/components/ArchivePanel'
import { TaskDialog } from '../../../features/tasks/components/TaskDialog'
import { QueryError } from '../../../components/QueryError'
import { FilterBar } from '../../../components/FilterBar'
import { PlusIcon } from '../../../components/Icons'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SectionHeader } from '@/components/SectionHeader'
import { TasksNav } from '../../../features/tasks/components/TasksNav'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '@repo/shared/types'

export const Route = createFileRoute('/_app/tasks/all')({
  component: TasksAllPage,
})

function TasksAllPage() {
  const { t } = useTranslation('tasks')
  // Get today's date in local timezone (not UTC)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const groupedQuery = useQuery(tasksQueries.grouped(today))
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const STATUS_OPTIONS = [
    { value: 'all', label: t('allStatuses') },
    { value: 'open', label: t('open', { ns: 'common' }) },
    { value: 'completed', label: t('completed', { ns: 'common' }) },
  ]

  const groups = groupedQuery.data?.groups ?? []
  const archive = groupedQuery.data?.archive ?? []

  // Apply client-side filters
  const filteredGroups = useMemo(() => {
    return groups
      .map((g) => ({
        ...g,
        tasks: g.tasks.filter((task: Task) => {
          if (statusFilter !== 'all' && task.status !== statusFilter) return false
          if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
          return true
        }),
      }))
      .filter((g) => g.tasks.length > 0)
  }, [groups, statusFilter, search])

  const totalCount = filteredGroups.reduce((sum, g) => sum + g.tasks.length, 0)

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

  async function handleReschedule(task: Task, date: string) {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { scheduledDate: date, status: 'open', isArchived: false },
      })
      toast.success(t('taskRescheduled'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  return (
    <div>
      <TasksNav />
      <SectionHeader
        sectionId="tasks"
        title={t('titleAll')}
        description={`${totalCount} ${t('total')}`}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon /> {t('addTask')}
          </Button>
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder={t('searchPlaceholder')}>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        {groupedQuery.isLoading && <SkeletonList lines={8} />}
        {groupedQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => groupedQuery.refetch()} />}

        {!groupedQuery.isLoading && !groupedQuery.isError && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Main grouped list */}
            <div className="space-y-3">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <TaskGroup
                    key={group.date_key}
                    dateKey={group.date_key}
                    tasks={group.tasks}
                    onToggle={toggleTask}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <EmptyState
                  title={search || statusFilter !== 'all' ? t('noMatchingTasks') : t('noTasks')}
                  description={search || statusFilter !== 'all' ? t('tryFilters') : t('createFromToday')}
                />
              )}
            </div>

            {/* Archive sidebar */}
            {archive.length > 0 && (
              <div className="hidden lg:block">
                <ArchivePanel
                  tasks={archive}
                  onReschedule={handleReschedule}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
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
