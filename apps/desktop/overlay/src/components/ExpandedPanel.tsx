import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useOverlayStore } from '@/stores/overlay.store'
import { useOverlayAuthStore } from '@/stores/auth.store'
import { overlayQueries } from '@/lib/overlay-queries'
import { overlayApi } from '@/lib/api-client'
import { useLiveTimer } from '@/hooks/use-live-timer'
import { setTimerStartTrigger } from '@/App'

export function ExpandedPanel() {
  const { isListening, lastCommand } = useOverlayStore()
  const { isAuthenticated } = useOverlayAuthStore()
  const queryClient = useQueryClient()

  // Queries
  const { data: tasksData = [] } = useQuery(overlayQueries.todayTasks())
  const { data: sessionData = null } = useQuery(overlayQueries.activeSession())
  const { data: summaryData } = useQuery(overlayQueries.dashboardSummary())

  // Live timer
  const timerState = useLiveTimer(sessionData)

  // Mutations
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await overlayApi.put(`/tasks/${taskId}`, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overlay', 'tasks'] })
    },
  })

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      await overlayApi.post('/pomodoro/sessions', {
        sessionType: 'focus',
        durationMinutes: 25,
        startedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overlay', 'pomodoro'] })
    },
  })

  // Derive stats
  const openTasks = tasksData.filter((t) => t.status === 'open').length
  const completedTasks = tasksData.filter((t) => t.status === 'completed').length
  const totalTasks = openTasks + completedTasks
  const streak = summaryData?.gamification?.currentStreak ?? 0

  // Register timer start trigger from tray
  useEffect(() => {
    setTimerStartTrigger(() => {
      if (!sessionData) {
        startTimerMutation.mutate()
      }
    })
  }, [sessionData, startTimerMutation])

  // Notify when pomodoro completes
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-80 rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl p-6 border border-white/20"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">ThePrimeWay</h2>
        <p className="text-sm text-gray-600">Please log in on the main app to use the overlay.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-80 rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl p-6 border border-white/20"
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4">ThePrimeWay</h2>

      {/* Timer section */}
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
            <p className="text-xs text-gray-600 mt-2">Pomodoro in progress</p>
          </div>
        </div>
      )}

      {/* Stats section */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Today's Tasks</span>
          <span className="font-semibold text-gray-900">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Habit Streak</span>
          <span className="font-semibold text-gray-900">{streak}</span>
        </div>
        {!sessionData && (
          <button
            onClick={() => startTimerMutation.mutate()}
            disabled={startTimerMutation.isPending}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {startTimerMutation.isPending ? 'Starting...' : 'Start Pomodoro'}
          </button>
        )}
      </div>

      {/* Tasks list */}
      {openTasks > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-gray-700 mb-2">Open Tasks:</p>
          <div className="space-y-1">
            {tasksData
              .filter((t) => t.status === 'open')
              .slice(0, 3)
              .map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    onChange={() => completeTaskMutation.mutate(task.id)}
                    disabled={completeTaskMutation.isPending}
                    className="w-3 h-3 cursor-pointer"
                  />
                  <span className="text-gray-700 truncate">{task.title}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Voice listener indicator */}
      {isListening && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 font-medium">Command:</p>
          <p className="text-xs text-gray-700 mt-1">{lastCommand}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">Phase 2: Connected to API ✓</p>
    </motion.div>
  )
}
