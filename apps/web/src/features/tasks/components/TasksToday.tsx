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
import { useAutoSchedule } from '@/features/scheduling/queries'
import { WorkingSessionsPanel } from '@/features/scheduling/components/WorkingSessionsPanel'
import { WorkloadCounter } from '@/features/scheduling/components/WorkloadCounter'
import { useRitualsToday } from '@/features/rituals/queries'
import { DailyPlanDialog } from '@/features/rituals/components/DailyPlanDialog'
import { DailyShutdownDialog } from '@/features/rituals/components/DailyShutdownDialog'
import { useEffect } from 'react'
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
  const autoSchedule = useAutoSchedule()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [planDismissed, setPlanDismissed] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [shutdownDismissed, setShutdownDismissed] = useState(false)
  const [shutdownOpen, setShutdownOpen] = useState(false)
  const ritualsQuery = useRitualsToday()
  const pendingDailyPlan = ritualsQuery.data?.pending.find((p) => p.ritual.kind === 'DAILY_PLAN') ?? null
  const pendingShutdown = ritualsQuery.data?.pending.find((p) => p.ritual.kind === 'DAILY_SHUTDOWN') ?? null

  useEffect(() => {
    if (pendingDailyPlan && !planDismissed) setPlanOpen(true)
  }, [pendingDailyPlan, planDismissed])

  // Auto-open shutdown once user is past its scheduled time and plan is already addressed.
  useEffect(() => {
    if (!pendingShutdown || shutdownDismissed || planOpen) return
    const now = new Date()
    const scheduled = new Date(pendingShutdown.scheduledFor)
    if (now >= scheduled) setShutdownOpen(true)
  }, [pendingShutdown, shutdownDismissed, planOpen])

  const tasks = tasksQuery.data?.data ?? []
  const openTasks = tasks.filter((task: Task) => task.status === 'open')
  const completedTasks = tasks.filter((task: Task) => task.status === 'completed')
  const unscheduledOpen = openTasks.filter((t: Task) => !t.scheduledStart)

  async function planDay() {
    if (unscheduledOpen.length === 0) return
    let scheduled = 0
    let failed = 0
    for (const task of unscheduledOpen) {
      try {
        const r = await autoSchedule.mutateAsync({ taskId: task.id, day: today })
        if (r.type === 'Success') scheduled++
        else failed++
      } catch {
        failed++
      }
    }
    if (scheduled > 0) toast.success(`Scheduled ${scheduled} task${scheduled === 1 ? '' : 's'}`)
    if (failed > 0) toast.warning(`${failed} couldn't fit — review manually`)
  }

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
          <div className="flex items-center gap-2">
            <WorkloadCounter day={today} tasks={tasks} />
            {unscheduledOpen.length > 0 && (
              <Button variant="outline" disabled={autoSchedule.isPending} onClick={planDay}>
                {autoSchedule.isPending ? 'Planning…' : `Plan day (${unscheduledOpen.length})`}
              </Button>
            )}
            <Button onClick={() => openCreate()}>
              <PlusIcon /> {t('addTask')}
            </Button>
          </div>
        }
      />
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        {tasksQuery.isLoading && <SkeletonList lines={8} />}
        {tasksQuery.isError && <QueryError message={t('failedToLoad')} onRetry={() => tasksQuery.refetch()} />}

        <WorkingSessionsPanel day={today} />

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

      {pendingDailyPlan && (
        <DailyPlanDialog
          instance={pendingDailyPlan}
          open={planOpen}
          onClose={() => { setPlanOpen(false); setPlanDismissed(true) }}
        />
      )}

      {pendingShutdown && (
        <DailyShutdownDialog
          instance={pendingShutdown}
          open={shutdownOpen}
          onClose={() => { setShutdownOpen(false); setShutdownDismissed(true) }}
        />
      )}
    </div>
  )
}

