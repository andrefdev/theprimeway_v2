import { useTranslation } from 'react-i18next'
import { Label } from '@/shared/components/ui/label'
import { useLocale } from '@/i18n/useLocale'
import { formatTime } from '@/i18n/format'

interface Props {
  suggestion?: { start: string; end: string }
  loading?: boolean
  visible?: boolean
}

export function ScheduleSuggestionPanel({ suggestion, loading, visible = true }: Props) {
  const { t } = useTranslation('tasks')
  const { locale } = useLocale()

  if (!visible) return null

  return (
    <div className="space-y-1.5 p-3 rounded-lg bg-secondary/50 border border-border/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{t('suggestedTime')}</Label>
        {loading && (
          <span className="text-xs text-muted-foreground">
            {t('common:loading', { defaultValue: 'Loading...' })}
          </span>
        )}
      </div>
      {suggestion ? (
        <div className="text-sm">
          <p className="text-foreground font-medium">
            {formatTime(suggestion.start, locale)} - {formatTime(suggestion.end, locale)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t('basedOnCalendar')}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('noSlotAvailable')}</p>
      )}
    </div>
  )
}
