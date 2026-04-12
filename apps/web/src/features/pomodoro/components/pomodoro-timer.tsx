import { useTranslation } from 'react-i18next'
import { MODE_LABEL_KEYS, type TimerMode } from './pomodoro-mode-selector'

interface PomodoroTimerProps {
  mode: TimerMode
  minutes: number
  seconds: number
  progress: number
  modeColor: string
}

export function PomodoroTimer({ mode, minutes, seconds, progress, modeColor }: PomodoroTimerProps) {
  const { t } = useTranslation('pomodoro')
  const modeLabel = t(MODE_LABEL_KEYS[mode])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Circular progress */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className={modeColor}
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div className="text-center z-10">
          <span className={`text-5xl font-bold tabular-nums ${modeColor}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <p className="mt-1 text-sm text-muted-foreground">{modeLabel}</p>
        </div>
      </div>
    </div>
  )
}
