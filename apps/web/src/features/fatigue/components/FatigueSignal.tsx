import { AlertCircle, Sparkles } from 'lucide-react'
import { useFatigueSignal } from '../queries'

interface Props {
  /** Optional hide when clear (nothing to nudge about). Default true. */
  hideWhenClear?: boolean
  /** Rendering style: inline (daily shutdown) vs card (dashboard). */
  variant?: 'inline' | 'card'
}

/**
 * Gentle nudge surface — shown when the anti-fatigue detector flags
 * mild or strong signal. Copy is deliberately non-shaming (roadmap risk:
 * "gamification feels childish if too aggressive").
 */
export function FatigueSignal({ hideWhenClear = true, variant = 'card' }: Props) {
  const { data, isLoading } = useFatigueSignal()

  if (isLoading || !data) return null
  if (hideWhenClear && data.level === 'clear') return null

  const tone =
    data.level === 'strong'
      ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400'
      : data.level === 'mild'
        ? 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400'
        : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'

  const Icon = data.level === 'clear' ? Sparkles : AlertCircle

  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${tone}`}>
        <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>{data.message}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-md border p-3 space-y-1 ${tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {data.level === 'strong' ? 'Watch' : data.level === 'mild' ? 'Heads up' : 'All clear'}
        </span>
      </div>
      <p className="text-sm">{data.message}</p>
      <p className="text-[11px] opacity-80">
        Last {data.windowDays} days · {data.totalCompleted} completed ·{' '}
        {Math.round(data.lowPriorityRatio * 100)}% low priority ·{' '}
        {Math.round(data.goalUnlinkedRatio * 100)}% goal-unlinked
      </p>
    </div>
  )
}
