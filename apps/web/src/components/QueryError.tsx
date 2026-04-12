import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { WarningIcon } from './Icons'

interface QueryErrorProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function QueryError({ message, onRetry, className = '' }: QueryErrorProps) {
  const { t } = useTranslation('common')
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center ${className}`}>
      <WarningIcon className="mb-3 text-destructive" />
      <p className="text-sm font-medium text-foreground">{t('failedToLoad')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{message || t('somethingWentWrong')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          {t('tryAgain')}
        </Button>
      )}
    </div>
  )
}
