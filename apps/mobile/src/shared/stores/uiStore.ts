import { create } from 'zustand';

type PomodoroStatus = 'idle' | 'running' | 'paused';
type SessionType = 'focus' | 'short_break' | 'long_break';

interface PomodoroState {
  status: PomodoroStatus;
  sessionType: SessionType;
  remainingSeconds: number;
  activeTaskId: string | null;
}

interface UiState {
  pomodoro: PomodoroState;
  badgeCounts: {
    tasks: number;
    notifications: number;
  };
  setPomodoroStatus: (status: PomodoroStatus) => void;
  setPomodoroSessionType: (type: SessionType) => void;
  setPomodoroRemaining: (seconds: number) => void;
  setPomodoroActiveTask: (taskId: string | null) => void;
  resetPomodoro: () => void;
  setBadgeCount: (key: 'tasks' | 'notifications', count: number) => void;
}

const DEFAULT_POMODORO: PomodoroState = {
  status: 'idle',
  sessionType: 'focus',
  remainingSeconds: 25 * 60,
  activeTaskId: null,
};

export const useUiStore = create<UiState>((set) => ({
  pomodoro: DEFAULT_POMODORO,
  badgeCounts: { tasks: 0, notifications: 0 },

  setPomodoroStatus: (status) =>
    set((state) => ({ pomodoro: { ...state.pomodoro, status } })),

  setPomodoroSessionType: (sessionType) => {
    const durations: Record<SessionType, number> = {
      focus: 25 * 60,
      short_break: 5 * 60,
      long_break: 15 * 60,
    };
    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        sessionType,
        remainingSeconds: durations[sessionType],
        status: 'idle',
      },
    }));
  },

  setPomodoroRemaining: (seconds) =>
    set((state) => ({ pomodoro: { ...state.pomodoro, remainingSeconds: seconds } })),

  setPomodoroActiveTask: (taskId) =>
    set((state) => ({ pomodoro: { ...state.pomodoro, activeTaskId: taskId } })),

  resetPomodoro: () => set({ pomodoro: DEFAULT_POMODORO }),

  setBadgeCount: (key, count) =>
    set((state) => ({ badgeCounts: { ...state.badgeCounts, [key]: count } })),
}));
