import { useState, useEffect } from 'react'
import type { PomodoroSession } from '@repo/shared'

export interface LiveTimer {
  minutes: number
  seconds: number
  progress: number
  isActive: boolean
  timeLeftSeconds: number
}

export function useLiveTimer(session: PomodoroSession | null): LiveTimer {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0)

  useEffect(() => {
    if (!session || session.isCompleted) {
      setTimeLeftSeconds(0)
      return
    }

    // Calculate initial time left
    const totalSeconds = session.durationMinutes * 60
    const elapsedSeconds = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setTimeLeftSeconds(remaining)

    // Update every second
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [session?.id, session?.startedAt, session?.isCompleted])

  if (!session || session.isCompleted || timeLeftSeconds <= 0) {
    return {
      minutes: 0,
      seconds: 0,
      progress: 0,
      isActive: false,
      timeLeftSeconds: 0,
    }
  }

  const totalSeconds = session.durationMinutes * 60
  const minutes = Math.floor(timeLeftSeconds / 60)
  const seconds = timeLeftSeconds % 60
  const progress = 1 - timeLeftSeconds / totalSeconds

  return {
    minutes,
    seconds,
    progress,
    isActive: timeLeftSeconds > 0,
    timeLeftSeconds,
  }
}
