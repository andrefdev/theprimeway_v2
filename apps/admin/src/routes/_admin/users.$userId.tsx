import { createFileRoute } from '@tanstack/react-router'
import { useUser, useUserSubscription, useUserFeatures } from '@/features/users/queries'
import { FeatureOverrideRow } from '@/components/feature-override-row'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from '@repo/ui'
import { PLAN_LIMITS } from '@repo/shared/constants'
import type { FeatureKey } from '@repo/shared/constants'
import { ArrowLeft } from 'lucide-react'

function UserDetailPage() {
  const { userId } = Route.useParams()
  const { data: user, isLoading: userLoading } = useUser(userId)
  const { data: subscription, isLoading: subLoading } = useUserSubscription(userId)
  const { data: overrides, isLoading: overridesLoading } = useUserFeatures(userId)

  const isLoading = userLoading || subLoading || overridesLoading

  // Determine plan tier from subscription
  const planTier = (subscription?.planTier || 'free') as 'free' | 'trial' | 'premium'
  const planDefaults = PLAN_LIMITS[planTier]

  // Create a map of overrides by feature key for easy lookup
  const overrideMap = new Map(
    (overrides || []).map((override) => [override.featureKey, override])
  )

  // Get all feature keys from the plan defaults
  const featureKeys = Object.keys(planDefaults) as FeatureKey[]

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{user?.name || user?.email || 'User'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Subscription card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Plan details and billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold capitalize">{subscription?.planTier || 'free'}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {subscription?.status || 'inactive'}
            </Badge>
          </div>

          {subscription?.currentPeriodStart && subscription?.currentPeriodEnd && (
            <div className="grid gap-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period starts</span>
                <span>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period ends</span>
                <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features grid */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Features & Limits</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Manage feature access and limits for this user. Overrides are marked with a badge.
        </p>
        <div className="grid gap-4">
          {featureKeys.map((featureKey) => {
            const planValue = planDefaults[featureKey]
            const override = overrideMap.get(featureKey)

            return (
              <FeatureOverrideRow
                key={featureKey}
                userId={userId}
                featureKey={featureKey}
                planValue={planValue}
                override={override}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_admin/users/$userId')({
  component: UserDetailPage,
})
