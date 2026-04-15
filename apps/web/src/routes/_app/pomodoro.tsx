import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  pomodoroQueries,
  useCreateSession,
  useUpdateSession,
} from '../../features/pomodoro/queries'
import { PomodoroModeSelector, MODE_LABEL_KEYS } from '../../features/pomodoro/components/PomodoroModeSelector'
import { usePomodoroStore, MODE_MINUTES, type TimerMode } from '@/stores/pomodoro.store'
import { PomodoroTimer } from '../../features/pomodoro/components/PomodoroTimer'
import { PomodoroControls } from '../../features/pomodoro/components/PomodoroControls'
import { PomodoroStats } from '../../features/pomodoro/components/PomodoroStats'
import { PomodoroSessionList } from '../../features/pomodoro/components/PomodoroSessionList'
import { toast } from 'sonner'
import { useEffect, useCallback } from 'react'

export const Route = createFileRoute('/_app/pomodoro')({
  component: PomodoroPage,
})

const MODE_COLORS: Record<TimerMode, string> = {
  focus: 'text-primary',
  short_break: 'text-success',
  long_break: 'text-warning',
}

function PomodoroPage() {
  const { t } = useTranslation('pomodoro')
  const statsQuery = useQuery(pomodoroQueries.stats())
  const sessionsQuery = useQuery(pomodoroQueries.sessions())
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  const {
    mode,
    timeLeft,
    isRunning,
    activeSessionId,
    setMode: setStoreMode,
    setIsRunning,
    setActiveSessionId,
    reset,
  } = usePomodoroStore()

  const modeMinutes = MODE_MINUTES[mode]
  const modeColor = MODE_COLORS[mode]

  // Timer finished
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleComplete()
    }
  }, [timeLeft, isRunning])

  function switchMode(newMode: TimerMode) {
    if (isRunning) return
    setStoreMode(newMode)
  }

  async function handleStart() {
    try {
      const result = await createSession.mutateAsync({
        sessionType: mode,
        durationMinutes: modeMinutes,
        startedAt: new Date().toISOString(),
      })
      setActiveSessionId(result.data.id)
      setIsRunning(true)
    } catch {
      toast.error(t('failedToStart'))
    }
  }

  function handlePause() {
    setIsRunning(false)
  }

  function handleResume() {
    setIsRunning(true)
  }

  const handleComplete = useCallback(async () => {
    const { activeSessionId: currentSessionId, mode: currentMode, timeLeft: currentTimeLeft } = usePomodoroStore.getState()
    setIsRunning(false)
    if (currentSessionId) {
      try {
        const modeLabel = t(MODE_LABEL_KEYS[currentMode])
        await updateSession.mutateAsync({
          id: currentSessionId,
          data: {
            isCompleted: true,
            endedAt: new Date().toISOString(),
            actualDuration: MODE_MINUTES[currentMode] * 60 - currentTimeLeft,
          },
        })
        toast.success(`${modeLabel} ${t('sessionCompleted')}`)
      } catch {
        toast.error(t('failedToSave'))
      }
    }
    setActiveSessionId(null)
    // Auto-switch: after focus go to break, after break go to focus
    if (currentMode === 'focus') {
      setStoreMode('short_break')
    } else {
      setStoreMode('focus')
    }
  }, [updateSession, t, setIsRunning, setActiveSessionId, setStoreMode])

  function handleReset() {
    reset()
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = 1 - timeLeft / (modeMinutes * 60)

  const stats = statsQuery.data?.data
  const recentSessions = (sessionsQuery.data?.data ?? []).slice(0, 5)

  return (
    <div className='mt-30'>
      {/*<SectionHeader sectionId="pomodoro" title={t('title')} />*/}
      <div className="mx-auto max-w-5xl px-6 pb-6 space-y-6">
        <PomodoroModeSelector mode={mode} onModeChange={switchMode} disabled={isRunning} />
        <PomodoroTimer mode={mode} minutes={minutes} seconds={seconds} progress={progress} modeColor={modeColor} />
        <div className="flex justify-center">
          <PomodoroControls
            isRunning={isRunning}
            hasActiveSession={!!activeSessionId}
            isCreating={createSession.isPending}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onFinish={handleComplete}
            onReset={handleReset}
          />
        </div>
        <PomodoroStats stats={stats} />
        <PomodoroSessionList recentSessions={recentSessions} sessionsQuery={sessionsQuery} />
      </div>
    </div>
  )
}
