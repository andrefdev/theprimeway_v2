import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Combobox, type ComboboxOption } from '@/shared/components/ui/combobox'
import { useMergeConcepts } from '@/features/brain/queries'
import type { BrainConceptNode } from '@repo/shared/types'

interface ConceptMergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: BrainConceptNode
  /** All concepts for the user, including source. We exclude source ourselves. */
  concepts: BrainConceptNode[]
  /** Refocus the surviving concept after merge succeeds. */
  onMerged: (targetId: string) => void
}

export function ConceptMergeDialog({
  open,
  onOpenChange,
  source,
  concepts,
  onMerged,
}: ConceptMergeDialogProps) {
  const { t } = useTranslation('brain')
  const [targetId, setTargetId] = useState<string | undefined>(undefined)
  const merge = useMergeConcepts()

  const options = useMemo<ComboboxOption[]>(
    () =>
      concepts
        .filter((c) => c.id !== source.id)
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .map((c) => ({
          value: c.id,
          label: c.name,
          description: `${c.kind} · ${c.mentionCount}`,
          keywords: [c.kind],
        })),
    [concepts, source.id],
  )

  const target = concepts.find((c) => c.id === targetId)

  function reset() {
    setTargetId(undefined)
  }

  function handleSubmit() {
    if (!targetId) return
    merge.mutate(
      { sourceId: source.id, targetId },
      {
        onSuccess: () => {
          toast.success(t('graph.merge.success'))
          onMerged(targetId)
          onOpenChange(false)
          reset()
        },
        onError: () => toast.error(t('graph.merge.error')),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('graph.merge.title')}</DialogTitle>
          <DialogDescription>
            {t('graph.merge.subtitle', { source: source.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Combobox
            options={options}
            value={targetId}
            onChange={(v) => setTargetId(v)}
            searchPlaceholder={t('graph.merge.searchPlaceholder')}
            emptyMessage={t('graph.search.noResults')}
            placeholder={t('graph.merge.searchPlaceholder')}
          />

          {target && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              {t('graph.merge.warning', { source: source.name, target: target.name })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            {t('graph.merge.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!targetId || merge.isPending}>
            {merge.isPending ? `${t('graph.merge.confirm')}…` : t('graph.merge.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
