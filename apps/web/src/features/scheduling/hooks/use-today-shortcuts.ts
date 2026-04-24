import { useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { schedulingApi } from '../api'
import { schedulingKeys } from '../queries'
import { tasksApi } from '@/features/tasks/api'
import { useFocusStore } from '@/features/focus/focus-store'
import type { Task } from '@repo/shared/types'

interface Options {
  /** yyyy-mm-dd */
  day: string
  tasks: Task[]
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
}

/**
 * Keyboard shortcuts scoped to the Today surface.
 *   ↑/↓         cycle selected task
 *   X           auto-schedule selected
 *   Shift+X     auto-schedule preventSplit
 *   C           toggle complete on selected
 *   F           focus mode (placeholder toast)
 *
 * Skips when focus is inside INPUT/TEXTAREA/contentEditable.
 */
export function useTodayShortcuts({ day, tasks, selectedTaskId, setSelectedTaskId }: Options) {
  const qc = useQueryClient()
  const selectableIds = tasks.filter((t) => t.status === 'open').map((t) => t.id)

  useEffect(() => {
    async function handle(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key
      const lower = key.toLowerCase()

      // Selection cycling
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        if (selectableIds.length === 0) return
        e.preventDefault()
        const idx = selectedTaskId ? selectableIds.indexOf(selectedTaskId) : -1
        const delta = key === 'ArrowDown' ? 1 : -1
        const next = (idx + delta + selectableIds.length) % selectableIds.length
        setSelectedTaskId(selectableIds[next] ?? null)
        return
      }

      if (!selectedTaskId) return
      const task = tasks.find((t) => t.id === selectedTaskId)
      if (!task) return

      if (lower === 'x') {
        e.preventDefault()
        try {
          const r = await schedulingApi.autoSchedule({ taskId: task.id, day, preventSplit: e.shiftKey })
          qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
          qc.invalidateQueries({ queryKey: ['tasks'] })
          if (r.type === 'Success') toast.success(e.shiftKey ? 'Scheduled (no split)' : 'Scheduled')
          else toast.warning(`Can't fit: ${r.reason}`)
        } catch (err) {
          toast.error((err as Error).message || 'Schedule failed')
        }
        return
      }

      if (lower === 'c') {
        e.preventDefault()
        try {
          const newStatus = task.status === 'completed' ? 'open' : 'completed'
          await tasksApi.update(task.id, { status: newStatus } as any)
          qc.invalidateQueries({ queryKey: ['tasks'] })
          if (newStatus === 'completed') {
            await schedulingApi.completeEarly({ taskId: task.id }).catch(() => undefined)
            qc.invalidateQueries({ queryKey: schedulingKeys.sessions })
            toast.success('Completed')
          } else {
            toast.success('Reopened')
          }
        } catch (err) {
          toast.error((err as Error).message || 'Toggle failed')
        }
        return
      }

      if (lower === 'f') {
        e.preventDefault()
        useFocusStore.getState().start(task.id)
      }
    }

    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [day, tasks, selectedTaskId, setSelectedTaskId, qc, selectableIds])
}
