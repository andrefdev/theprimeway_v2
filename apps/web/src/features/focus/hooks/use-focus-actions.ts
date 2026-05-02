import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi } from '@/features/tasks/api'
import { useStartTimer, useStopTimer, useUpdateTask } from '@/features/tasks/queries'
import { schedulingApi } from '@/features/scheduling/api'
import { schedulingKeys } from '@/features/scheduling/queries'
import type { Task } from '@repo/shared/types'
import { useFocusStore } from '../focus-store'
import { useFocusNextTask } from './use-focus-next-task'

interface FocusActionsArgs {
  taskId: string | null
  task: Task | null | undefined
  acceptance: string
  durationMinutes: number | null
  onStarted: () => void
  onPaused: () => void
  onResumed: () => void
  onClose: () => void
}

export function useFocusActions({
  taskId,
  task,
  acceptance,
  durationMinutes,
  onStarted,
  onPaused,
  onResumed,
  onClose,
}: FocusActionsArgs) {
  const qc = useQueryClient()
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const updateTask = useUpdateTask()
  const fetchNextTask = useFocusNextTask()
  const replace = useFocusStore((s) => s.replace)
  const [isLoadingNext, setIsLoadingNext] = useState(false)

  async function start() {
    if (!taskId) return
    try {
      const patch: Record<string, unknown> = {}
      if ((task?.acceptanceCriteria ?? '') !== acceptance) {
        patch.acceptanceCriteria = acceptance || null
      }
      const taskDur = task?.estimatedDuration ?? null
      if (durationMinutes && durationMinutes !== taskDur) {
        patch.estimatedDuration = durationMinutes
      }
      if (Object.keys(patch).length > 0) {
        await updateTask.mutateAsync({ id: taskId, data: patch })
      }
      await startTimer.mutateAsync(taskId)
      schedulingApi.timerStart({ taskId }).catch(() => undefined)
      onStarted()
    } catch (err) {
      toast.error((err as Error).message || 'Could not start')
    }
  }

  async function pause() {
    if (!taskId) return
    try {
      await stopTimer.mutateAsync(taskId)
      onPaused()
    } catch (err) {
      toast.error((err as Error).message || 'Pause failed')
    }
  }

  async function resume() {
    if (!taskId) return
    try {
      await startTimer.mutateAsync(taskId)
      onResumed()
    } catch (err) {
      toast.error((err as Error).message || 'Resume failed')
    }
  }

  async function goToNextTask(justCompletedId: string) {
    setIsLoadingNext(true)
    try {
      const next = await fetchNextTask(justCompletedId)
      if (!next) {
        toast.message('Nothing else queued')
        onClose()
        return
      }
      qc.setQueryData(['tasks', 'focus', next.id], next)
      replace(next.id)
    } catch (err) {
      toast.error((err as Error).message || 'Could not load next task')
      onClose()
    } finally {
      setIsLoadingNext(false)
    }
  }

  async function complete(over: boolean) {
    if (!taskId) return
    const completingId = taskId
    try {
      if (task?.actualStart && !task?.actualEnd) {
        await stopTimer.mutateAsync(completingId)
      }
      await tasksApi.update(completingId, { status: 'completed' })
      schedulingApi.completeEarly({ taskId: completingId }).catch(() => undefined)
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      toast.success(over ? 'Completed (overtime)' : 'Task completed')
      await goToNextTask(completingId)
    } catch (err) {
      toast.error((err as Error).message || 'Complete failed')
    }
  }

  const isCompleting =
    updateTask.isPending || stopTimer.isPending || isLoadingNext

  return {
    start,
    pause,
    resume,
    complete,
    isStarting: startTimer.isPending || updateTask.isPending,
    isPausing: stopTimer.isPending,
    isCompleting,
  }
}
