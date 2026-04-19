import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { usePlans, useDeletePlan } from '@/features/plans/queries'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Checkbox,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
} from '@repo/ui'
import { Plus, ChevronRight, Trash2 } from 'lucide-react'

function PlansPage() {
  const [includeInactive, setIncludeInactive] = useState(true)
  const { data: plans, isLoading } = usePlans(includeInactive)
  const del = useDeletePlan()
  const navigate = useNavigate()

  const rows = plans || []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Plans</h1>
          <p className="text-muted-foreground">
            Manage subscription plans, limits, and feature flags.
          </p>
        </div>
        <Link to="/plans/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Plans</CardTitle>
            <Checkbox
              label="Show inactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No plans yet"
              description="Create your first subscription plan to get started."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>LS Variant</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: '/plans/$planId', params: { planId: plan.id } })}
                  >
                    <TableCell className="font-medium">{plan.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{plan.name}</TableCell>
                    <TableCell>
                      {plan.price} {plan.currency}
                    </TableCell>
                    <TableCell className="capitalize">{plan.billingInterval}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {plan.lemonSqueezyVariantId || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? 'primary' : 'outline'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                plan.isActive
                                  ? `Deactivate "${plan.displayName}"? Users on this plan keep it; new checkouts hide it.`
                                  : `Permanently delete "${plan.displayName}"? This cannot be undone.`,
                              )
                            ) {
                              del.mutate({ id: plan.id, hard: !plan.isActive })
                            }
                          }}
                          disabled={del.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {del.isError && (
            <p className="mt-3 text-sm text-destructive">
              {(del.error as any)?.response?.data?.error || (del.error as Error)?.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_admin/plans/')({
  component: PlansPage,
})
