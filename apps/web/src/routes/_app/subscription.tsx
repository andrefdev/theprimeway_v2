import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { toast } from 'sonner'
import { subscriptionQueries } from '../../features/subscriptions/queries'
import { subscriptionsApi } from '../../features/subscriptions/api'
import { PlanCard } from '../../features/subscriptions/components/plan-card'
import type { SubscriptionPlan, SubscriptionStatus } from '@repo/shared/types'

export const Route = createFileRoute('/_app/subscription')({
  component: SubscriptionPage,
})

function SubscriptionPage() {
  const { t } = useTranslation('subscriptions')
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const plansQuery = useQuery(subscriptionQueries.plans())
  const statusQuery = useQuery(subscriptionQueries.status())

  const plans = (plansQuery.data?.data ?? []) as SubscriptionPlan[]
  const status = statusQuery.data?.data as SubscriptionStatus | undefined

  async function handleStartTrial() {
    setLoading(true)
    try {
      await subscriptionsApi.startTrial()
      queryClient.invalidateQueries({ queryKey: subscriptionQueries.all() })
      toast.success(t('trialStarted'))
    } catch {
      toast.error(t('trialFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectPlan(plan: SubscriptionPlan) {
    setLoading(true)
    try {
      const { url } = await subscriptionsApi.createCheckout(plan.variantId)
      window.location.href = url
    } catch {
      toast.error(t('checkoutFailed'))
      setLoading(false)
    }
  }

  const tierLabel: Record<string, string> = {
    free: t('tierFree'),
    trial: t('tierTrial'),
    premium: t('tierPremium'),
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {/* Current status */}
        {statusQuery.isLoading ? (
          <SkeletonList lines={1} />
        ) : status && (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t('currentSubscription')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={status.isActive ? 'default' : 'secondary'}>
                    {tierLabel[status.tier] ?? status.tier}
                  </Badge>
                  {status.tier === 'trial' && status.trialEndsAt && (
                    <span className="text-xs text-muted-foreground">
                      {t('trialEnds', { date: new Date(status.trialEndsAt).toLocaleDateString() })}
                    </span>
                  )}
                  {status.cancelAtPeriodEnd && (
                    <span className="text-xs text-destructive">{t('cancelsAtEnd')}</span>
                  )}
                </div>
              </div>
              {status.tier === 'free' && (
                <Button variant="outline" size="sm" onClick={handleStartTrial} disabled={loading}>
                  {t('startFreeTrial')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        {plansQuery.isLoading ? (
          <SkeletonList lines={3} />
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={status?.tier === 'premium' && status.isActive}
                onSelect={handleSelectPlan}
                loading={loading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('noPlans')}</p>
          </div>
        )}

        {/* FAQ */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('faqTitle')}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('faq1Q')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('faq1A')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('faq2Q')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('faq2A')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('faq3Q')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('faq3A')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
