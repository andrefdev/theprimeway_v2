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
}

/**
 * Shared dialog shell for Quarterly + Annual reviews. Uses PromptRitualDialog
 * for iterative prompts and surfaces AI summary on the final step.
 */
export function PeriodReviewDialog({ instance, open, onClose, title, periodLabel }: Props) {
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => complete()}
              className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Complete review
            </button>
          </div>
        </div>
      )}
    />
  )
}
