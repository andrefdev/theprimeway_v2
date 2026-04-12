import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from '@repo/ui'
import { ArrowLeft } from 'lucide-react'
import { FeatureOverrideRow } from '@/components/feature-override-row'
import { FEATURES } from '@repo/shared/constants'
import { PLAN_LIMITS } from '@repo/shared/constants/plans'
import type { PlanTier } from '@repo/shared/constants/plans'

interface UserDetail {
  id: string
  email: string | null
  name: string | null
  role: string
}

interface UserSubscription {
  userId: string
  planTier: PlanTier
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

interface FeatureOverride {
  id: string
  userId: string
  featureKey: string
  enabled: boolean
  reason: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function UserDetailsPage() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()

  // Fetch user details
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/users/${userId}`)
      return data.data as UserDetail
    },
  })

  // Fetch subscription
  const subscriptionQuery = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/users/${userId}/subscription`)
      return data.data as UserSubscription
    },
  })

  // Fetch feature overrides
  const overridesQuery = useQuery({
    queryKey: ['user-overrides', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/users/${userId}/features`)
      return data.data as FeatureOverride[]
    },
  })

  if (userQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const user = userQuery.data
  const subscription = subscriptionQuery.data
  const overrides = overridesQuery.data || []
  const planTier = subscription?.planTier || 'free'
  const planLimits = PLAN_LIMITS[planTier as PlanTier]

  if (!user) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/_admin/users' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="capitalize">{user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Current subscription status and plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan Tier</p>
                  <p className="capitalize">{subscription.planTier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="capitalize">{subscription.status}</p>
                </div>
              </div>
              {subscription.currentPeriodStart && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Period Start</p>
                    <p className="text-sm">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Period End</p>
                    <p className="text-sm">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Overrides Card */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Overrides</CardTitle>
          <CardDescription>Manage feature access for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {overridesQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(FEATURES).map(([key, featureKey]) => {
                const override = overrides.find((o) => o.featureKey === featureKey)
                const planValue = planLimits[featureKey as keyof typeof planLimits]

                return (
                  <FeatureOverrideRow
                    key={featureKey}
                    userId={userId}
                    featureKey={featureKey as any}
                    planValue={planValue}
                    override={override}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_admin/users/$userId')({
  component: UserDetailsPage,
})
