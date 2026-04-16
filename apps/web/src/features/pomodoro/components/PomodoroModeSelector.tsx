import { useTranslation } from 'react-i18next'
import { type TimerMode, MODE_MINUTES } from '@/shared/stores/pomodoro.store'

export type { TimerMode }
export { MODE_MINUTES }

export const MODE_LABEL_KEYS: Record<TimerMode, string> = {
  focus: 'modeFocus',
  short_break: 'modeShortBreak',
  long_break: 'modeLongBreak',
}

interface PomodoroModeSelectorProps {
  mode: TimerMode
  onModeChange: (mode: TimerMode) => void
  disabled: boolean
}

export function PomodoroModeSelector({ mode, onModeChange, disabled }: PomodoroModeSelectorProps) {
  const { t } = useTranslation('pomodoro')

  return (
    <div className="flex justify-center gap-2">
      {(Object.keys(MODE_MINUTES) as TimerMode[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onModeChange(key)}
          disabled={disabled}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50'
          }`}
        >
          {t(MODE_LABEL_KEYS[key])}
        </button>
      ))}
    </div>
  )
}
