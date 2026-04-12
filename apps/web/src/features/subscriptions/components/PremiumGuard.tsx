import { useQuery } from '@tanstack/react-query'
import { subscriptionQueries } from '../queries'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

interface PremiumGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PremiumGuard({ children, fallback }: PremiumGuardProps) {
  const { t } = useTranslation('subscriptions')
  const statusQuery = useQuery(subscriptionQueries.status())
  const status = statusQuery.data?.data

  // While loading, render children (optimistic)
  if (statusQuery.isLoading) return <>{children}</>

  // Premium or active trial
  if (status?.isActive) return <>{children}</>

  // Custom fallback or default upgrade prompt
  if (fallback) return <>{fallback}</>

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6 text-center">
        <div className="text-3xl mb-2">&#x1F451;</div>
        <h3 className="text-lg font-bold text-foreground">{t('premiumFeature')}</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{t('premiumDescription')}</p>
        <Button asChild>
          <Link to="/subscription">{t('upgradeToPremium')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
