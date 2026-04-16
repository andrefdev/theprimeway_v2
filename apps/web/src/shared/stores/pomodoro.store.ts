import { create } from 'zustand'

export type TimerMode = 'focus' | 'short_break' | 'long_break'

export const MODE_MINUTES: Record<TimerMode, number> = {
  focus: 25,
  short_break: 5,
  long_break: 15,
}

interface PomodoroState {
  mode: TimerMode
  timeLeft: number // seconds
  isRunning: boolean
  activeSessionId: string | null
  // Actions
  setMode: (mode: TimerMode) => void
  setTimeLeft: (timeLeft: number | ((prev: number) => number)) => void
  setIsRunning: (running: boolean) => void
  setActiveSessionId: (id: string | null) => void
  reset: () => void
  tick: () => void
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'focus',
  timeLeft: MODE_MINUTES.focus * 60,
  isRunning: false,
  activeSessionId: null,

  setMode: (mode) => set({ mode, timeLeft: MODE_MINUTES[mode] * 60, activeSessionId: null }),
  setTimeLeft: (timeLeft) =>
    set((state) => ({
      timeLeft: typeof timeLeft === 'function' ? timeLeft(state.timeLeft) : timeLeft,
    })),
  setIsRunning: (isRunning) => set({ isRunning }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  reset: () => {
    const { mode } = get()
    set({ timeLeft: MODE_MINUTES[mode] * 60, isRunning: false, activeSessionId: null })
  },
  tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
}))
