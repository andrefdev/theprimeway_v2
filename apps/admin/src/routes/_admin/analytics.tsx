import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@repo/ui'
import { Users, Activity, CreditCard, TrendingUp } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useAnalyticsSummary } from '@/features/analytics/queries'
import { DataTable } from '@/components/data-table'

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  icon: typeof Users
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

type ByPlanRow = { planId: string | null; planName: string; displayName: string; count: number }
type ByStatusRow = { status: string; count: number }
type OverrideRow = { featureKey: string; enabled: number; disabled: number }

function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsSummary()

  const planCols = useMemo<ColumnDef<ByPlanRow>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Plan',
        cell: ({ row }) => <span className="font-medium">{row.original.displayName}</span>,
      },
      {
        accessorKey: 'count',
        header: () => <span className="block text-right">Count</span>,
        cell: ({ row }) => <span className="block text-right">{row.original.count}</span>,
      },
    ],
    [],
  )

  const statusCols = useMemo<ColumnDef<ByStatusRow>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <span className="font-medium capitalize">{row.original.status}</span>,
      },
      {
        accessorKey: 'count',
        header: () => <span className="block text-right">Count</span>,
        cell: ({ row }) => <span className="block text-right">{row.original.count}</span>,
      },
    ],
    [],
  )

  const overrideCols = useMemo<ColumnDef<OverrideRow>[]>(
    () => [
      {
        accessorKey: 'featureKey',
        header: 'Feature',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.featureKey}</span>,
      },
      {
        accessorKey: 'enabled',
        header: () => <span className="block text-right">Enabled</span>,
        cell: ({ row }) => <span className="block text-right">{row.original.enabled}</span>,
      },
      {
        accessorKey: 'disabled',
        header: () => <span className="block text-right">Disabled</span>,
        cell: ({ row }) => <span className="block text-right">{row.original.disabled}</span>,
      },
    ],
    [],
  )

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform overview and usage metrics</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { users, subscriptions, usage, growth30d, featureOverrides } = data

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform overview and usage metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Users" value={users.total} icon={Users} hint={`${users.admins} admins`} />
        <Kpi label="DAU (7d)" value={users.dau7d} icon={Activity} hint="Active last 7 days" />
        <Kpi label="MAU (30d)" value={users.mau30d} icon={Activity} hint="Active last 30 days" />
        <Kpi
          label="Active Subs"
          value={subscriptions.byStatus.find((s) => s.status === 'active')?.count ?? 0}
          icon={CreditCard}
          hint={`${subscriptions.byStatus.reduce((a, b) => a + b.count, 0)} total`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
            <CardDescription>Distribution across plans</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={planCols}
              data={subscriptions.byPlan}
              hideSearch
              hidePagination
              empty="No subscriptions"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Status</CardTitle>
            <CardDescription>Active / trialing / canceled</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={statusCols}
              data={subscriptions.byStatus}
              hideSearch
              hidePagination
              empty="No data"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Totals</CardTitle>
          <CardDescription>Aggregated across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Habits" value={usage.totalHabits} icon={Activity} />
            <Kpi label="Goals" value={usage.totalGoals} icon={Activity} />
            <Kpi label="Tasks" value={usage.totalTasks} icon={Activity} />
            <Kpi label="Pomodoros (day)" value={usage.dailyPomodoroSessions} icon={Activity} />
            <Kpi label="AI reqs (day)" value={usage.dailyAiRequests} icon={Activity} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>30-Day Growth</CardTitle>
          <CardDescription>New records created in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Tasks" value={growth30d.tasks} icon={TrendingUp} />
            <Kpi label="Habits" value={growth30d.habits} icon={TrendingUp} />
            <Kpi label="Pomodoros" value={growth30d.pomodoro} icon={TrendingUp} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Overrides</CardTitle>
          <CardDescription>Manual toggles per feature</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={overrideCols}
            data={featureOverrides}
            searchPlaceholder="Filter features..."
            pageSize={10}
            empty="No overrides"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_admin/analytics')({
  component: AnalyticsPage,
})
