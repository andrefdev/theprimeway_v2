export interface PomodoroSession {
  id: string
  userId: string
  sessionType: 'focus' | 'short_break' | 'long_break'
  durationMinutes: number
  actualDuration: number | null
  isCompleted: boolean
  taskId: string | null
  startedAt: string
  endedAt: string | null
  notes: string | null
  createdAt: string
}

export interface PomodoroStats {
  totalSessions: number
  totalFocusMinutes: number
  completedSessions: number
  averageDuration: number
  todaySessions: number
  todayFocusMinutes: number
  streakDays: number
}

export interface PomodoroDailyStat {
  id: string
  userId: string
  date: string
  sessionsCompleted: number
  totalFocusMinutes: number
}
