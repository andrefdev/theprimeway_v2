import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tasksApi } from '@/features/tasks/api'
import { useStartTimer, useStopTimer, useUpdateTask } from '@/features/tasks/queries'
import { schedulingApi } from '@/features/scheduling/api'
import { schedulingKeys } from '@/features/scheduling/queries'
import type { Task } from '@repo/shared/types'

interface FocusActionsArgs {
  taskId: string | null
  task: Task | null | undefined
  acceptance: string
  durationMinutes: number | null
  onStarted: () => void
  onPaused: () => void
  onResumed: () => void
  onCompleted: () => void
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
  onCompleted,
  onClose,
}: FocusActionsArgs) {
  const qc = useQueryClient()
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const updateTask = useUpdateTask()
  const [savingNextStep, setSavingNextStep] = useState(false)

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

  async function complete(over: boolean) {
    if (!taskId) return
    try {
      if (task?.actualStart && !task?.actualEnd) {
        await stopTimer.mutateAsync(taskId)
      }
      await tasksApi.update(taskId, { status: 'completed' })
      await schedulingApi.completeEarly({ taskId }).catch(() => undefined)
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
      toast.success(over ? 'Completed (overtime)' : 'Task completed')
      onCompleted()
    } catch (err) {
      toast.error((err as Error).message || 'Complete failed')
    }
  }

  async function saveNextStep(title: string) {
    const trimmed = title.trim()
    if (!trimmed) {
      onClose()
      return
    }
    setSavingNextStep(true)
    try {
      await tasksApi.create({ title: trimmed })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Next step added to backlog')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add next step')
    } finally {
      setSavingNextStep(false)
      onClose()
    }
  }

  return {
    start,
    pause,
    resume,
    complete,
    saveNextStep,
    savingNextStep,
    isStarting: startTimer.isPending || updateTask.isPending,
    isPausing: stopTimer.isPending,
  }
}
