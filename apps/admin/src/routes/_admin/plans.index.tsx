import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { usePlans, useDeletePlan, useFreePlan } from '@/features/plans/queries'
import type { Plan } from '@/features/plans/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Checkbox,
  Skeleton,
  EmptyState,
} from '@repo/ui'
import { Plus, ChevronRight, Trash2, Settings } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'

function PlansPage() {
  const [includeInactive, setIncludeInactive] = useState(true)
  const { data: plans, isLoading } = usePlans(includeInactive)
  const { data: freePlan, isLoading: freeLoading } = useFreePlan()
  const del = useDeletePlan()
  const navigate = useNavigate()

  // Hide the free plan from the paid-plans table — it gets its own card.
  const rows: Plan[] = (plans || []).filter((p) => p.name !== 'free')

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => <span className="font-medium">{row.original.displayName}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <span>
            {row.original.price} {row.original.currency}
          </span>
        ),
      },
      {
        accessorKey: 'billingInterval',
        header: 'Interval',
        cell: ({ row }) => <span className="capitalize">{row.original.billingInterval}</span>,
      },
      {
        accessorKey: 'lemonSqueezyVariantId',
        header: 'LS Variant',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.lemonSqueezyVariantId || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Active',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'primary' : 'outline'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const plan = row.original
          return (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
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
          )
        },
      },
    ],
    [del],
  )

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

      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Free Plan Defaults</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Global limits and feature flags applied to every user without a paid
                subscription.
              </p>
            </div>
          </div>
          {freeLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : freePlan ? (
            <Button
              variant="outline"
              onClick={() =>
                navigate({ to: '/plans/$planId', params: { planId: freePlan.id } })
              }
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit defaults
            </Button>
          ) : null}
        </CardHeader>
        {freePlan && (
          <CardContent>
            <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
              <FreeLimit label="Habits" value={freePlan.maxHabits} />
              <FreeLimit label="Goals" value={freePlan.maxGoals} />
              <FreeLimit label="Tasks" value={freePlan.maxTasks} />
              <FreeLimit label="Pomodoros / day" value={freePlan.maxPomodoroSessionsDaily} />
              <FreeLimit label="Brain entries" value={freePlan.maxBrainEntries} />
              <FreeFlag label="AI Assistant" value={!!freePlan.hasAiAssistant} />
              <FreeFlag label="Brain module" value={!!freePlan.hasBrainModule} />
              <FreeFlag label="Advanced Analytics" value={!!freePlan.hasAdvancedAnalytics} />
              <FreeFlag label="Custom Themes" value={!!freePlan.hasCustomThemeCreation} />
              <FreeFlag label="Export Data" value={!!freePlan.hasExportData} />
              <FreeFlag label="Priority Support" value={!!freePlan.hasPrioritySupport} />
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paid Plans</CardTitle>
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
            <DataTable
              columns={columns}
              data={rows}
              searchPlaceholder="Search plans..."
              pageSize={10}
              empty="No plans match."
              onRowClick={(p) => navigate({ to: '/plans/$planId', params: { planId: p.id } })}
              toolbar={
                <Checkbox
                  label="Show inactive"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
              }
            />
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

function FreeLimit({ label, value }: { label: string; value: number | null | undefined }) {
  const display = value === -1 ? '∞' : value ?? '—'
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{display}</p>
    </div>
  )
}

function FreeFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={value ? 'primary' : 'outline'}>{value ? 'On' : 'Off'}</Badge>
    </div>
  )
}

export const Route = createFileRoute('/_admin/plans/')({
  component: PlansPage,
})
