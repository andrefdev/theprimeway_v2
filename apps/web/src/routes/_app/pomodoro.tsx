import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/components/SectionHeader'
import {
  pomodoroQueries,
  useCreateSession,
  useUpdateSession,
} from '../../features/pomodoro/queries'
import { PomodoroModeSelector, MODE_MINUTES, MODE_LABEL_KEYS, type TimerMode } from '../../features/pomodoro/components/PomodoroModeSelector'
import { PomodoroTimer } from '../../features/pomodoro/components/PomodoroTimer'
import { PomodoroControls } from '../../features/pomodoro/components/PomodoroControls'
import { PomodoroStats } from '../../features/pomodoro/components/PomodoroStats'
import { PomodoroSessionList } from '../../features/pomodoro/components/PomodoroSessionList'
import { toast } from 'sonner'
import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(MODE_MINUTES.focus * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const modeMinutes = MODE_MINUTES[mode]
  const modeColor = MODE_COLORS[mode]

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft])

  // Timer finished
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleComplete()
    }
  }, [timeLeft, isRunning])

  function switchMode(newMode: TimerMode) {
    if (isRunning) return
    setMode(newMode)
    setTimeLeft(MODE_MINUTES[newMode] * 60)
    setActiveSessionId(null)
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
    setIsRunning(false)
    if (activeSessionId) {
      try {
        const modeLabel = t(MODE_LABEL_KEYS[mode])
        await updateSession.mutateAsync({
          id: activeSessionId,
          data: {
            isCompleted: true,
            endedAt: new Date().toISOString(),
            actualDuration: modeMinutes * 60 - timeLeft,
          },
        })
        toast.success(`${modeLabel} ${t('sessionCompleted')}`)
      } catch {
        toast.error(t('failedToSave'))
      }
    }
    setActiveSessionId(null)
    // Auto-switch: after focus go to break, after break go to focus
    if (mode === 'focus') {
      setMode('short_break')
      setTimeLeft(MODE_MINUTES.short_break * 60)
    } else {
      setMode('focus')
      setTimeLeft(MODE_MINUTES.focus * 60)
    }
  }, [activeSessionId, modeMinutes, mode, timeLeft, updateSession, t])

  function handleReset() {
    setIsRunning(false)
    setTimeLeft(modeMinutes * 60)
    setActiveSessionId(null)
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
