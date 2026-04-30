import { useEffect } from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { overlayApi } from '@/lib/api-client'
import { overlayQueries } from '@/lib/overlay-queries'
import { useOverlayStore } from '@/stores/overlay.store'
import { useOverlayAuthStore } from '@/stores/auth.store'

export function useTrayEvents() {
  const qc = useQueryClient()
  const { setQuickCaptureOpen, toggleFocusMode } = useOverlayStore()
  const { isAuthenticated } = useOverlayAuthStore()

  const { data: session } = useQuery({
    ...overlayQueries.activeSession(),
    enabled: isAuthenticated,
  })
  const { data: tasks = [] } = useQuery({
    ...overlayQueries.todayTasks(),
    enabled: isAuthenticated,
  })

  const startTimer = useMutation({
    mutationFn: async () => {
      await overlayApi.post('/pomodoro/sessions', {
        sessionType: 'focus',
        durationMinutes: 25,
        startedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] }),
  })

  const pauseTimer = useMutation({
    mutationFn: async () => {
      const session = qc.getQueryData<any>(overlayQueries.activeSession().queryKey)
      if (!session?.id) return
      await overlayApi.put(`/pomodoro/sessions/${session.id}`, { isPaused: true })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] }),
  })

  const stopTimer = useMutation({
    mutationFn: async () => {
      const s = qc.getQueryData<any>(overlayQueries.activeSession().queryKey)
      if (!s?.id) return
      await overlayApi.put(`/pomodoro/sessions/${s.id}`, {
        isCompleted: true,
        endedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] }),
  })

  const completeCurrent = useMutation({
    mutationFn: async () => {
      const session = qc.getQueryData<any>(overlayQueries.activeSession().queryKey)
      const taskId = session?.taskId
      if (!taskId) return
      await overlayApi.put(`/tasks/${taskId}`, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlay', 'tasks'] }),
  })

  useEffect(() => {
    const unlisteners: Promise<UnlistenFn>[] = [
      listen('tray-start-timer', () => startTimer.mutate()),
      listen('tray-pause-timer', () => pauseTimer.mutate()),
      listen('tray-stop-timer', () => stopTimer.mutate()),
      listen('tray-complete-current', () => completeCurrent.mutate()),
      listen('tray-quick-capture', () => setQuickCaptureOpen(true)),
      listen('tray-toggle-focus', () => toggleFocusMode()),
    ]

    return () => {
      unlisteners.forEach((p) => p.then((fn) => fn()).catch(() => {}))
    }
  }, [])

  // Dynamic tray icon based on state
  const openTasks = tasks.filter((t) => t.status === 'open').length
  useEffect(() => {
    const state = session && !session.isCompleted ? 'timer' : openTasks > 0 ? 'tasks' : 'idle'
    void invoke('set_tray_icon_state', { state }).catch(() => {})
  }, [session?.id, session?.isCompleted, openTasks])
}
