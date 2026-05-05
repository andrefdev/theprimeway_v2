import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/components/ui/badge'
import type { BrainConceptNode } from '@repo/shared/types'

interface ConceptHoverCardProps {
  concept: BrainConceptNode
  /** Pixel coords relative to the graph container — caller positions absolutely. */
  x: number
  y: number
}

export function ConceptHoverCard({ concept, x, y }: ConceptHoverCardProps) {
  const { t } = useTranslation('brain')
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-[260px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium leading-tight">{concept.name}</p>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {concept.kind}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('graph.hover.mentions', { count: concept.mentionCount })}
      </p>
      {concept.firstQuote && (
        <p className="mt-2 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground">
          &ldquo;{concept.firstQuote}&rdquo;
        </p>
      )}
    </div>
  )
}
