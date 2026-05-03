import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Loader2, AlertCircle, Plus, Trash2, RefreshCw, Pin, PinOff } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
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

export function BrainEntryDetail({ entryId, onDeleted }: Props) {
  const { t } = useTranslation('brain')
  const { dateFnsLocale } = useLocale()
  const { data: entry, isLoading } = useBrainEntry(entryId)
  const applyMut = useApplyActionItem(entryId)
  const deleteMut = useDeleteBrainEntry()
  const reprocessMut = useReprocessBrainEntry()
  const updateMut = useUpdateBrainEntry(entryId)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const typeLabel = (k: string) => t(`type.${k}`, { defaultValue: k })

  if (isLoading || !entry) {
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  const processing = ['pending', 'transcribing', 'analyzing'].includes(entry.status)
  const failed = entry.status === 'failed'

  async function onApply(idx: number) {
    try {
      await applyMut.mutateAsync(idx)
      toast.success(t('toast.taskCreated'))
    } catch (err: any) {
      if (err?.response?.status === 409) toast.info(t('toast.alreadyApplied'))
      else toast.error(t('toast.createTaskFailed'))
    }
  }

  async function onDelete() {
    try {
      await deleteMut.mutateAsync(entryId)
      toast.success(t('toast.deleted'))
      onDeleted()
    } catch {
      toast.error(t('toast.deleteFailed'))
    } finally {
      setConfirmDeleteOpen(false)
    }
  }

  async function onReprocess() {
    try {
      await reprocessMut.mutateAsync(entryId)
      toast.success(t('toast.reprocessing'))
    } catch {
      toast.error(t('toast.reprocessFailed'))
    }
  }

  async function togglePin() {
    if (!entry) return
    try {
      await updateMut.mutateAsync({ isPinned: !entry.isPinned })
    } catch {
      toast.error(t('toast.updateFailed'))
    }
  }

  const actionItems = (entry.actionItems ?? []) as BrainActionItem[]
  const crossLinks = (entry.crossLinks ?? []) as BrainCrossLink[]

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: dateFnsLocale })}
          </div>
          <h2 className="text-lg font-semibold leading-tight">
            {processing ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('detail.processing')}
              </span>
            ) : (
              entry.userTitle ?? entry.title ?? t('card.untitled')
            )}
          </h2>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={togglePin} title={entry.isPinned ? t('detail.unpin') : t('detail.pin')}>
            {entry.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          {failed && (
            <Button size="sm" variant="ghost" onClick={onReprocess} title={t('detail.retryAi')}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteOpen(true)} title={t('detail.delete')}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('detail.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t('detail.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); onDelete() }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? t('detail.deleting') : t('detail.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {failed && (
        <Alert variant="destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertTitle>{t('detail.processingFailed')}</AlertTitle>
          {entry.errorMessage && <AlertDescription>{entry.errorMessage}</AlertDescription>}
          <Button size="sm" variant="outline" className="mt-2" onClick={onReprocess}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> {t('detail.retry')}
          </Button>
        </Alert>
      )}

      {/* Raw transcript always visible */}
      <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">{entry.rawTranscript}</div>

      {!processing && !failed && (
        <>
          {entry.summary && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('detail.summary')}</div>
              <p className="text-sm text-foreground/80">{entry.summary}</p>
            </div>
          )}

          {entry.topics && entry.topics.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('detail.topics')}</div>
              <div className="flex flex-wrap gap-1">
                {entry.topics.map((topic) => (
                  <Badge key={topic} variant="outline" className="text-[10px]">{topic}</Badge>
                ))}
              </div>
            </div>
          )}

          {actionItems.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('detail.actionItems')}</div>
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
                      <Badge variant="secondary" className="text-[10px] shrink-0">{t('detail.created')}</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onApply(idx)} disabled={applyMut.isPending}>
                        <Plus className="h-3 w-3 mr-1" /> {t('detail.createTask')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {crossLinks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('detail.connections')}</div>
              <ul className="space-y-1">
                {crossLinks.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">{typeLabel(l.targetType)}</Badge>
                    <span className="truncate">{l.target?.title ?? `(${t('card.untitled')})`}</span>
                    <span className="text-muted-foreground">· {l.linkType.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!entry.summary && !actionItems.length && !crossLinks.length && entry.status === 'complete' && (
            <p className="text-xs text-muted-foreground italic">
              {t('detail.noConnections')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
