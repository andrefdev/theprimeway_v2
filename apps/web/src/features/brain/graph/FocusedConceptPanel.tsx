import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNowStrict } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { GitMerge, X } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { ConceptMergeDialog } from './ConceptMergeDialog'
import type { BrainConceptNode } from '@repo/shared/types'

interface FocusedConceptPanelProps {
  concept: BrainConceptNode
  concepts: BrainConceptNode[]
  onClose: () => void
  /** Called after a successful merge so the parent re-focuses the survivor. */
  onMerged: (targetId: string) => void
}

export function FocusedConceptPanel({
  concept,
  concepts,
  onClose,
  onMerged,
}: FocusedConceptPanelProps) {
  const { t, i18n } = useTranslation('brain')
  const [mergeOpen, setMergeOpen] = useState(false)
  const locale = i18n.language?.startsWith('es') ? es : enUS
  const lastSeen = formatDistanceToNowStrict(new Date(concept.lastMentionedAt), {
    addSuffix: true,
    locale,
  })

  return (
    <>
      <div className="absolute right-3 top-3 z-10 w-72 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{concept.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {concept.kind}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {t('graph.hover.mentions', { count: concept.mentionCount })}
                <span className="px-1">·</span>
                {lastSeen}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onClose}
            title={t('graph.focusPanel.close')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {concept.firstQuote && (
          <p className="mt-2 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground">
            &ldquo;{concept.firstQuote}&rdquo;
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-1.5"
          onClick={() => setMergeOpen(true)}
        >
          <GitMerge className="h-3.5 w-3.5" />
          {t('graph.focusPanel.merge')}
        </Button>
      </div>

      <ConceptMergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        source={concept}
        concepts={concepts}
        onMerged={onMerged}
      />
    </>
  )
}
