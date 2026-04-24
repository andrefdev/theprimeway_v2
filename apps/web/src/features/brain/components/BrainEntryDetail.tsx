import { toast } from 'sonner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Loader2, AlertCircle, Plus, Trash2, RefreshCw, Pin, PinOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  useApplyActionItem,
  useBrainEntry,
  useDeleteBrainEntry,
  useReprocessBrainEntry,
  useUpdateBrainEntry,
} from '../queries'
import type { BrainActionItem, BrainCrossLink } from '@repo/shared/types'

interface Props {
  entryId: string
  onDeleted: () => void
}

const TYPE_LABEL: Record<string, string> = {
  task: 'Task',
  goal: 'Goal',
  habit: 'Habit',
  note: 'Note',
}

export function BrainEntryDetail({ entryId, onDeleted }: Props) {
  const { data: entry, isLoading } = useBrainEntry(entryId)
  const applyMut = useApplyActionItem(entryId)
  const deleteMut = useDeleteBrainEntry()
  const reprocessMut = useReprocessBrainEntry()
  const updateMut = useUpdateBrainEntry(entryId)

  if (isLoading || !entry) {
    return <div className="text-xs text-muted-foreground p-4">Loading…</div>
  }

  const processing = ['pending', 'transcribing', 'analyzing'].includes(entry.status)
  const failed = entry.status === 'failed'

  async function onApply(idx: number) {
    try {
      await applyMut.mutateAsync(idx)
      toast.success('Task created')
    } catch (err: any) {
      if (err?.response?.status === 409) toast.info('Already applied')
      else toast.error('Failed to create task')
    }
  }

  async function onDelete() {
    if (!confirm('Delete this thought? This cannot be undone.')) return
    try {
      await deleteMut.mutateAsync(entryId)
      toast.success('Deleted')
      onDeleted()
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function onReprocess() {
    try {
      await reprocessMut.mutateAsync(entryId)
      toast.success('Reprocessing…')
    } catch {
      toast.error('Failed to reprocess')
    }
  }

  async function togglePin() {
    if (!entry) return
    try {
      await updateMut.mutateAsync({ isPinned: !entry.isPinned })
    } catch {
      toast.error('Failed to update')
    }
  }

  const actionItems = (entry.actionItems ?? []) as BrainActionItem[]
  const crossLinks = (entry.crossLinks ?? []) as BrainCrossLink[]

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
          </div>
          <h2 className="text-lg font-semibold leading-tight">
            {processing ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando tu idea…
              </span>
            ) : (
              entry.userTitle ?? entry.title ?? 'Untitled'
            )}
          </h2>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={togglePin} title={entry.isPinned ? 'Unpin' : 'Pin'}>
            {entry.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          {failed && (
            <Button size="sm" variant="ghost" onClick={onReprocess} title="Retry AI">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {failed && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-3 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" /> Processing failed
          </div>
          {entry.errorMessage && <p className="text-xs mt-1">{entry.errorMessage}</p>}
          <Button size="sm" variant="outline" className="mt-2" onClick={onReprocess}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Raw transcript always visible */}
      <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">{entry.rawTranscript}</div>

      {!processing && !failed && (
        <>
          {entry.summary && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Summary</div>
              <p className="text-sm text-foreground/80">{entry.summary}</p>
            </div>
          )}

          {entry.topics && entry.topics.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Topics</div>
              <div className="flex flex-wrap gap-1">
                {entry.topics.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {actionItems.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Action items</div>
              <ul className="space-y-1.5">
                {actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 rounded-md border border-border/50 p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.description}</div>
                      )}
                    </div>
                    {item.appliedTaskId ? (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Created</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onApply(idx)} disabled={applyMut.isPending}>
                        <Plus className="h-3 w-3 mr-1" /> Create task
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {crossLinks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Connections</div>
              <ul className="space-y-1">
                {crossLinks.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[l.targetType] ?? l.targetType}</Badge>
                    <span className="truncate">{l.target?.title ?? '(unknown)'}</span>
                    <span className="text-muted-foreground">· {l.linkType.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!entry.summary && !actionItems.length && !crossLinks.length && entry.status === 'complete' && (
            <p className="text-xs text-muted-foreground italic">
              AI processed this but didn't find connections — it's in your feed for reference.
            </p>
          )}
        </>
      )}
    </div>
  )
}
