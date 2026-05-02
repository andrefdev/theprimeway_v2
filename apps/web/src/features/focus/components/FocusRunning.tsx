import { Button } from '@/shared/components/ui/button'
import { Pause, Play, Check, LogOut } from 'lucide-react'
import { VisionThreadChip } from '@/features/vision/components/VisionThreadChip'
import { FocusSubtasksPanel } from './FocusSubtasksPanel'

type Phase = 'running' | 'paused'

interface Props {
  taskId: string
  title: string
  acceptance: string
  phase: Phase
  elapsedMs: number
  targetMs: number | null
  over: boolean
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onClose: () => void
  isPausing: boolean
  isStarting: boolean
  isCompleting: boolean
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function FocusRunning({
  taskId,
  title,
  acceptance,
  phase,
  elapsedMs,
  targetMs,
  over,
  onPause,
  onResume,
  onComplete,
  onClose,
  isPausing,
  isStarting,
  isCompleting,
}: Props) {
  return (
    <div className="w-full max-w-6xl flex items-start gap-8">
      <div className="hidden md:block pt-4">
        <FocusSubtasksPanel taskId={taskId} />
      </div>
      <div className="flex-1 text-center space-y-10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {phase === 'paused' ? 'Paused' : over ? 'Overtime' : 'In focus'}
        </div>
        <div
          className={`font-mono tabular-nums leading-none select-none ${
            over
              ? 'text-rose-500'
              : phase === 'paused'
                ? 'text-muted-foreground'
                : 'text-foreground'
          }`}
          style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
        >
          {formatDuration(elapsedMs)}
        </div>
        {targetMs != null && (
          <div className="text-sm text-muted-foreground">
            target {Math.round(targetMs / 60_000)}m
            {over && ` · +${Math.round((elapsedMs - targetMs) / 60_000)}m over`}
          </div>
        )}

        <div>
          <h2 className="text-xl font-medium">{title}</h2>
          <div className="mt-1">
            <VisionThreadChip taskId={taskId} />
          </div>
          {acceptance && (
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              <span className="font-medium text-foreground">Done means:</span> {acceptance}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          {phase === 'running' ? (
            <Button variant="outline" onClick={onPause} disabled={isPausing}>
              <Pause className="h-4 w-4 mr-1" /> Pause
            </Button>
          ) : (
            <Button variant="outline" onClick={onResume} disabled={isStarting}>
              <Play className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
          <Button onClick={onComplete} disabled={isCompleting}>
            <Check className="h-4 w-4 mr-1" /> {isCompleting ? 'Completing…' : 'Complete'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <LogOut className="h-4 w-4 mr-1" /> Exit (keep timer)
          </Button>
        </div>
      </div>
    </div>
  )
}
