import { PromptRitualDialog } from './PromptRitualDialog'
import { AiRitualSummary } from './AiRitualSummary'
import type { RitualInstance } from '../api'

interface Props {
  instance: RitualInstance
  open: boolean
  onClose: () => void
  /** Human-readable title shown in the dialog header. */
  title: string
  /** Short hint shown above prompts (e.g. "Q2 2026" or "2026"). */
  periodLabel: string
  /** When false, the Complete button is disabled until `unlockDate`. Defaults to true. */
  unlocked?: boolean
  unlockDate?: Date | null
}

/**
 * Shared dialog shell for Quarterly + Annual reviews. Uses PromptRitualDialog
 * for iterative prompts and surfaces AI summary on the final step.
 */
export function PeriodReviewDialog({
  instance,
  open,
  onClose,
  title,
  periodLabel,
  unlocked = true,
  unlockDate = null,
}: Props) {
  const snapshot = (instance.snapshot ?? {}) as {
    aiSummary?: any
    aiSummaryAt?: string
  }

  return (
    <PromptRitualDialog
      instance={instance}
      open={open}
      onClose={onClose}
      title={title}
      hint={
        <div>
          Reviewing <span className="font-medium text-foreground">{periodLabel}</span>. Take a breath — this is the long view.
        </div>
      }
      finalStep={({ complete }) => (
        <div className="space-y-4">
          <AiRitualSummary
            instanceId={instance.id}
            label="Summarize this period"
            cached={snapshot.aiSummary ?? null}
            cachedAt={snapshot.aiSummaryAt ?? null}
          />
          <div className="flex items-center justify-end gap-3">
            {!unlocked && unlockDate && (
              <span className="text-xs text-muted-foreground">
                Available from {unlockDate.toISOString().slice(0, 10)}
              </span>
            )}
            <button
              type="button"
              onClick={() => complete()}
              disabled={!unlocked}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete review
            </button>
          </div>
        </div>
      )}
    />
  )
}
