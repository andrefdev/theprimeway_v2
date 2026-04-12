import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PomodoroControlsProps {
  isRunning: boolean
  hasActiveSession: boolean
  isCreating: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onReset: () => void
}

export function PomodoroControls({
  isRunning,
  hasActiveSession,
  isCreating,
  onStart,
  onPause,
  onResume,
  onFinish,
  onReset,
}: PomodoroControlsProps) {
  const { t } = useTranslation('pomodoro')

  return (
    <div className="flex items-center gap-3">
      {!isRunning && !hasActiveSession && (
        <Button size="lg" onClick={onStart} disabled={isCreating}>
          {t('start')}
        </Button>
      )}
      {isRunning && (
        <Button size="lg" variant="outline" onClick={onPause}>
          {t('pause')}
        </Button>
      )}
      {!isRunning && hasActiveSession && (
        <>
          <Button size="lg" onClick={onResume}>
            {t('resume')}
          </Button>
          <Button size="lg" variant="ghost" onClick={onFinish}>
            {t('finish')}
          </Button>
        </>
      )}
      {(isRunning || hasActiveSession) && (
        <Button size="lg" variant="ghost" onClick={onReset}>
          {t('reset')}
        </Button>
      )}
    </div>
  )
}
