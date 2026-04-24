import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { ritualsApi } from '../api'

type Insight = Awaited<ReturnType<typeof ritualsApi.aiSummary>>

interface Props {
  instanceId: string
  /** Label for the trigger button. */
  label?: string
  /** Pre-existing snapshot payload (if ritual already has an aiSummary persisted). */
  cached?: Insight | null
  /** ISO timestamp when cached was generated. */
  cachedAt?: string | null
}

/**
 * Scoped AI summary block. Renders a trigger button; on click, fetches
 * structured insights for the ritual instance and displays them.
 * Spec §8 Phase 4: AI is always "scoped to a ritual moment".
 */
export function AiRitualSummary({ instanceId, label = 'Generate AI summary', cached = null, cachedAt = null }: Props) {
  const [insight, setInsight] = useState<Insight | null>(cached)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setInsight(await ritualsApi.aiSummary(instanceId))
    } catch (err) {
      toast.error((err as Error).message || 'AI summary failed')
    } finally {
      setLoading(false)
    }
  }

  if (!insight) {
    return (
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:bg-accent/40 disabled:opacity-60"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? 'Analyzing…' : label}
      </button>
    )
  }

  const staleHint =
    cachedAt && insight === cached
      ? ` · cached ${new Date(cachedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
      : ''

  return (
    <div className="rounded-md border border-border bg-card/60 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3 w-3 text-primary" /> AI summary<span className="text-muted-foreground font-normal">{staleHint}</span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Re-run'}
        </button>
      </div>
      <p className="text-sm text-foreground">{insight.summary}</p>
      {insight.highlights.length > 0 && (
        <Section label="Highlights" items={insight.highlights} />
      )}
      {insight.blockers.length > 0 && (
        <Section label="Blockers" items={insight.blockers} />
      )}
      <div className="border-t border-border/40 pt-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Next focus</div>
        <p className="text-sm font-medium">{insight.suggestedNextFocus}</p>
      </div>
    </div>
  )
}

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <ul className="list-disc pl-4 space-y-0.5">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  )
}
