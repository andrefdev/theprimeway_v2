import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { VisionThreadChip } from '@/features/vision/components/VisionThreadChip'
import { FocusDurationField } from './FocusDurationField'

interface Props {
  taskId: string
  title: string
  acceptance: string
  setAcceptance: (v: string) => void
  durationMinutes: number | null
  setDurationMinutes: (m: number | null) => void
  onStart: () => void
  onCancel: () => void
  isStarting: boolean
}

export function FocusPreflight({
  taskId,
  title,
  acceptance,
  setAcceptance,
  durationMinutes,
  setDurationMinutes,
  onStart,
  onCancel,
  isStarting,
}: Props) {
  return (
    <div className="max-w-xl w-full space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          About to focus on
        </div>
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        <VisionThreadChip taskId={taskId} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">What does done look like?</Label>
        <Textarea
          autoFocus
          rows={2}
          value={acceptance}
          onChange={(e) => setAcceptance(e.target.value)}
          placeholder="e.g. First draft written, skeleton PR opened, etc."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">How long do you actually need?</Label>
        <FocusDurationField
          taskId={taskId}
          value={durationMinutes}
          onChange={setDurationMinutes}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onStart} disabled={isStarting}>
          {isStarting ? 'Starting…' : 'Start focus'}
        </Button>
      </div>
    </div>
  )
}
