import { Badge } from '@/shared/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Pin, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/useLocale'
import type { BrainEntry } from '@repo/shared/types'

interface Props {
  entry: BrainEntry
  selected?: boolean
  onClick: () => void
}

const ACTIVE_STATUSES = new Set(['pending', 'transcribing', 'analyzing'])

export function BrainEntryCard({ entry, selected, onClick }: Props) {
  const { t } = useTranslation('brain')
  const { dateFnsLocale } = useLocale()
  const processing = ACTIVE_STATUSES.has(entry.status)
  const failed = entry.status === 'failed'
  const displayTitle =
    entry.userTitle ??
    entry.title ??
    (entry.rawTranscript ? entry.rawTranscript.slice(0, 60) + (entry.rawTranscript.length > 60 ? '…' : '') : t('card.untitled'))

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md border p-3 transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {entry.isPinned && <Pin className="h-3 w-3 text-primary" />}
            {processing && <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />}
            {failed && <AlertCircle className="h-3 w-3 text-rose-500" />}
            <span className={`text-sm font-medium truncate ${processing ? 'text-muted-foreground italic' : ''}`}>
              {processing ? t('card.processing') : displayTitle}
            </span>
          </div>
          {!processing && entry.topics && entry.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.topics.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] font-normal">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: dateFnsLocale })}
        </span>
      </div>
    </button>
  )
}
