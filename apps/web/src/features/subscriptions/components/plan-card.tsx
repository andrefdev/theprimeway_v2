import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import type { SubscriptionPlan } from '@repo/shared/types'

interface PlanCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
  onSelect: (plan: SubscriptionPlan) => void
  loading?: boolean
}

export function PlanCard({ plan, isCurrentPlan, onSelect, loading }: PlanCardProps) {
  const { t } = useTranslation('subscriptions')

  const isPopular = plan.interval === 'yearly'

  return (
    <Card className={`relative transition-all ${isPopular ? 'border-primary shadow-lg scale-[1.02]' : ''} ${isCurrentPlan ? 'border-emerald-500/50' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs">{t('popular')}</Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-xs">{t('currentPlan')}</Badge>
        </div>
      )}

      <CardContent className="p-6 text-center">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>

        <div className="my-4">
          <span className="text-3xl font-bold text-foreground">
            {plan.currency === 'USD' ? '$' : plan.currency}{plan.price}
          </span>
          <span className="text-sm text-muted-foreground">
            /{plan.interval === 'monthly' ? t('month') : t('year')}
          </span>
        </div>

        <ul className="space-y-2 text-left mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isCurrentPlan || loading}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? t('currentPlan') : t('selectPlan')}
        </Button>
      </CardContent>
    </Card>
  )
}
