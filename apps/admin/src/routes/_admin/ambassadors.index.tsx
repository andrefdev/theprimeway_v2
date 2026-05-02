import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useAmbassadors } from '@/features/ambassadors/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Input,
  Select,
} from '@repo/ui'
import { ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import type { Ambassador, AmbassadorStatus } from '@/features/ambassadors/api'

function AmbassadorsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const { data, isLoading } = useAmbassadors({
    status: status || undefined,
    search: search || undefined,
    take: 100,
  })

  const rows = data ?? []

  const columns = useMemo<ColumnDef<Ambassador>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.user?.email ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'tier',
        header: 'Tier',
        cell: ({ row }) =>
          row.original.tier ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: row.original.tier.badgeColor ?? '#6366f1' }}
            >
              {row.original.tier.name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'platform',
        header: 'Platform',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.primaryPlatform} · {row.original.primaryHandle}
          </span>
        ),
      },
      {
        accessorKey: 'audienceSize',
        header: 'Audience',
        cell: ({ row }) =>
          row.original.audienceSize ? row.original.audienceSize.toLocaleString() : '—',
      },
      {
        accessorKey: 'referralCount',
        header: 'Referrals',
        cell: ({ row }) => row.original._count?.referrals ?? 0,
      },
      {
        accessorKey: 'appliedAt',
        header: 'Applied',
        cell: ({ row }) => new Date(row.original.appliedAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ambassadors</h1>
        <p className="text-sm text-muted-foreground">Manage applications, tiers, and payouts.</p>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="w-48">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
          />
        </div>
        <div className="w-72">
          <label className="text-xs text-muted-foreground">Search</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name, email, handle, code..." />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} ambassadors</CardTitle>
          <CardDescription>Click a row to view details and take action.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              onRowClick={(row) => navigate({ to: '/ambassadors/$id' as any, params: { id: row.id } as any })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: AmbassadorStatus }) {
  const map: Record<AmbassadorStatus, { variant: any; label: string }> = {
    PENDING: { variant: 'outline', label: 'Pending' },
    APPROVED: { variant: 'primary', label: 'Approved' },
    REJECTED: { variant: 'secondary', label: 'Rejected' },
    SUSPENDED: { variant: 'secondary', label: 'Suspended' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export const Route = createFileRoute('/_admin/ambassadors/' as any)({
  component: AmbassadorsPage,
})
