export const SOUND_REGISTRY = {
  taskComplete:  { src: '/sounds/task-complete.mp3',  volume: 0.6 },
  habitComplete: { src: '/sounds/habit-complete.mp3', volume: 0.5 },
  pomodoroStart: { src: '/sounds/pomodoro-start.mp3', volume: 0.4 },
  pomodoroEnd:   { src: '/sounds/pomodoro-end.mp3',   volume: 0.6 },
  goalComplete:  { src: '/sounds/goal-complete.mp3',  volume: 0.7 },
  uiClick:       { src: '/sounds/ui-click.mp3',       volume: 0.3 },
  error:         { src: '/sounds/error.mp3',          volume: 0.5 },
} as const

export type SoundKey = keyof typeof SOUND_REGISTRY
