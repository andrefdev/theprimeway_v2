import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Badge } from '@/shared/components/ui/badge'
import { Copy, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAmbassadorMe } from '../queries'
import { AmbassadorBanner } from './AmbassadorBanner'
import { AmbassadorApplyForm } from './AmbassadorApplyForm'

export function AmbassadorTab() {
  const { t } = useTranslation('ambassador')
  const { data, isLoading } = useAmbassadorMe()
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (!data) {
    if (showForm) {
      return <AmbassadorApplyForm onCancel={() => setShowForm(false)} onSubmitted={() => setShowForm(false)} />
    }
    return <AmbassadorBanner onApply={() => setShowForm(true)} />
  }

  if (data.status === 'PENDING') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('pending.title', { defaultValue: 'Solicitud en revisión' })}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('pending.message', { defaultValue: 'Estamos revisando tu solicitud. Normalmente toma 1-3 días. Te notificaremos por email y notificación cuando haya respuesta.' })}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (data.status === 'REJECTED') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('rejected.title', { defaultValue: 'Solicitud no aprobada' })}</h3>
          {data.rejectionReason && (
            <div className="mb-4 mx-auto max-w-md p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm">
              <strong>{t('rejected.reason', { defaultValue: 'Motivo' })}:</strong> {data.rejectionReason}
            </div>
          )}
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('rejected.retry', { defaultValue: 'Podrás reaplicar después de 30 días.' })}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (data.status === 'SUSPENDED') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('suspended.title', { defaultValue: 'Cuenta suspendida' })}</h3>
          <p className="text-muted-foreground">{t('suspended.message', { defaultValue: 'Contacta soporte para más información.' })}</p>
        </CardContent>
      </Card>
    )
  }

  // APPROVED
  const link = `${window.location.origin}/login?ref=${data.referralCode}`
  function copy(value: string) {
    navigator.clipboard.writeText(value)
    toast.success(t('copied', { defaultValue: 'Copiado al portapapeles' }))
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{t('approved.title', { defaultValue: 'Eres embajador' })}</span>
              {data.tier && (
                <Badge style={{ backgroundColor: data.tier.badgeColor ?? '#6366f1', color: '#fff' }}>{data.tier.name}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('approved.subtitle', { defaultValue: 'Comparte tu código y empieza a ganar comisiones recurrentes.' })}
            </div>
          </div>
          <Button onClick={() => navigate({ to: '/ambassador' })} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('approved.openDashboard', { defaultValue: 'Dashboard completo' })}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {t('approved.code', { defaultValue: 'Tu código' })}
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-lg font-mono font-bold text-indigo-600">{data.referralCode}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(data.referralCode!)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {t('approved.link', { defaultValue: 'Tu link' })}
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm truncate">{link}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(link)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
