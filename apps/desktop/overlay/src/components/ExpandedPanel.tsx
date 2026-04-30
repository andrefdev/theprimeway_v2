import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useOverlayStore } from '@/stores/overlay.store'
import { useOverlayAuthStore } from '@/stores/auth.store'
import { overlayQueries } from '@/lib/overlay-queries'
import { overlayApi } from '@/lib/api-client'
import { useLiveTimer } from '@/hooks/use-live-timer'

const startDrag = (e: React.MouseEvent) => {
  if (e.button !== 0) return
  if ((e.target as HTMLElement).closest('input,button,textarea,[data-no-drag]')) return
  void getCurrentWebviewWindow().startDragging()
}

export function ExpandedPanel() {
  const { isListening, lastCommand, quickCaptureOpen, setQuickCaptureOpen, focusMode } = useOverlayStore()
  const { isAuthenticated } = useOverlayAuthStore()
  const queryClient = useQueryClient()
  const [quickTitle, setQuickTitle] = useState('')
  const quickInputRef = useRef<HTMLInputElement>(null)

  const { data: tasksData = [] } = useQuery({
    ...overlayQueries.todayTasks(),
    enabled: isAuthenticated,
  })
  const { data: sessionData = null } = useQuery({
    ...overlayQueries.activeSession(),
    enabled: isAuthenticated,
  })
  const { data: summaryData } = useQuery({
    ...overlayQueries.dashboardSummary(),
    enabled: isAuthenticated,
  })
  const { data: habits = [] } = useQuery({
    ...overlayQueries.todayHabits(),
    enabled: isAuthenticated,
  })

  const timerState = useLiveTimer(sessionData)

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await overlayApi.put(`/tasks/${taskId}`, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overlay', 'tasks'] }),
  })

  const snoozeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      await overlayApi.put(`/tasks/${taskId}`, { scheduledDate: tomorrow })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overlay', 'tasks'] }),
  })

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      await overlayApi.post('/pomodoro/sessions', {
        sessionType: 'focus',
        durationMinutes: 25,
        startedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] }),
  })

  const pauseTimerMutation = useMutation({
    mutationFn: async () => {
      if (!sessionData?.id) return
      await overlayApi.put(`/pomodoro/sessions/${sessionData.id}`, { isPaused: true })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] }),
  })

  const habitCheckinMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const today = new Date().toISOString().split('T')[0]
      await overlayApi.post(`/habits/${habitId}/logs`, {
        date: today,
        completedCount: 1,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overlay', 'habits'] }),
  })

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      await overlayApi.post('/tasks', {
        title,
        status: 'open',
        scheduledDate: new Date().toISOString().split('T')[0],
      })
    },
    onSuccess: () => {
      setQuickTitle('')
      setQuickCaptureOpen(false)
      queryClient.invalidateQueries({ queryKey: ['overlay', 'tasks'] })
    },
  })

  const openTasks = tasksData.filter((t) => t.status === 'open').length
  const completedTasks = tasksData.filter((t) => t.status === 'completed').length
  const totalTasks = openTasks + completedTasks
  const streak = summaryData?.gamification?.currentStreak ?? 0

  useEffect(() => {
    if (quickCaptureOpen) quickInputRef.current?.focus()
  }, [quickCaptureOpen])

  const notifiedRef = useRef(false)
  useEffect(() => {
    if (sessionData && timerState.timeLeftSeconds === 0 && !notifiedRef.current) {
      notifiedRef.current = true
      void sendNotification({
        title: '¡Pomodoro completado!',
        body: 'Excelente trabajo. Tómate un descanso bien ganado.',
      })
    } else if (timerState.timeLeftSeconds > 0) {
      notifiedRef.current = false
    }
  }, [timerState.timeLeftSeconds, sessionData])

  if (!isAuthenticated) {
    return (
      <motion.div
        onMouseDown={startDrag}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-80 rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl p-6 border border-white/20 cursor-grab"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">ThePrimeWay</h2>
        <p className="text-sm text-gray-600">Please log in on the main app to use the overlay.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      onMouseDown={startDrag}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-80 rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl p-6 border border-white/20 cursor-grab"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">ThePrimeWay</h2>
        {focusMode && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Focus
          </span>
        )}
      </div>

      {sessionData && (
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 font-mono">
              {String(timerState.minutes).padStart(2, '0')}:{String(timerState.seconds).padStart(2, '0')}
            </div>
            <div className="w-full bg-gray-200 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${timerState.progress * 100}%` }}
              />
            </div>
            <button
              data-no-drag
              onClick={() => pauseTimerMutation.mutate()}
              className="mt-2 text-xs text-purple-700 hover:text-purple-900"
            >
              Pausar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Tareas hoy</span>
          <span className="font-semibold text-gray-900">{completedTasks}/{totalTasks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Habit Streak</span>
          <span className="font-semibold text-gray-900">{streak}</span>
        </div>
        {!sessionData && (
          <button
            data-no-drag
            onClick={() => startTimerMutation.mutate()}
            disabled={startTimerMutation.isPending}
            className="w-full mt-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {startTimerMutation.isPending ? 'Iniciando...' : 'Iniciar Pomodoro'}
          </button>
        )}
      </div>

      {quickCaptureOpen ? (
        <form
          data-no-drag
          onSubmit={(e) => {
            e.preventDefault()
            if (quickTitle.trim()) createTaskMutation.mutate(quickTitle.trim())
          }}
          className="mb-4 flex gap-1"
        >
          <input
            ref={quickInputRef}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setQuickCaptureOpen(false)
                setQuickTitle('')
              }
            }}
          />
          <button
            type="submit"
            disabled={!quickTitle.trim() || createTaskMutation.isPending}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded disabled:opacity-50"
          >
            +
          </button>
        </form>
      ) : (
        <button
          data-no-drag
          onClick={() => setQuickCaptureOpen(true)}
          className="w-full mb-4 text-xs text-gray-500 border border-dashed border-gray-300 rounded py-1 hover:bg-gray-50"
        >
          + Quick capture (Ctrl+Shift+N)
        </button>
      )}

      {openTasks > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-gray-700 mb-2">Pendientes:</p>
          <div className="space-y-1">
            {tasksData.filter((t) => t.status === 'open').slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-xs" data-no-drag>
                <input
                  type="checkbox"
                  onChange={() => completeTaskMutation.mutate(task.id)}
                  disabled={completeTaskMutation.isPending}
                  className="w-3 h-3 cursor-pointer"
                />
                <span className="text-gray-700 truncate flex-1">{task.title}</span>
                <button
                  onClick={() => snoozeTaskMutation.mutate(task.id)}
                  className="text-[10px] text-gray-400 hover:text-gray-700"
                  title="Posponer a mañana"
                >
                  ⏭
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200" data-no-drag>
          <p className="text-xs font-medium text-amber-800 mb-2">Hábitos hoy:</p>
          <div className="flex flex-wrap gap-1">
            {habits.slice(0, 6).map((h: any) => {
              const done = (h.todayLog?.completedCount ?? 0) > 0
              return (
                <button
                  key={h.id}
                  onClick={() => !done && habitCheckinMutation.mutate(h.id)}
                  disabled={done || habitCheckinMutation.isPending}
                  className={
                    done
                      ? 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800'
                      : 'text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'
                  }
                  title={done ? 'Completado hoy' : 'Marcar como hecho'}
                >
                  {done ? '✓ ' : ''}{h.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isListening && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <span className="text-xs text-blue-600">Listening...</span>
          </div>
        </div>
      )}

      {lastCommand && !isListening && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 font-medium">Command:</p>
          <p className="text-xs text-gray-700 mt-1">{lastCommand}</p>
        </div>
      )}
    </motion.div>
  )
}
