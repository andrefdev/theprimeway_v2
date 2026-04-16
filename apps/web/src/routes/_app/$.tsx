import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'

export const Route = createFileRoute('/_app/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  const { t } = useTranslation('common')
  return (
    <div>
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-6xl font-bold text-muted-foreground/30">404</p>
          <h2 className="mt-4 text-xl font-semibold text-foreground">{t('notFoundTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('notFoundDescription')}
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button variant="outline">{t('backToDashboard')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
