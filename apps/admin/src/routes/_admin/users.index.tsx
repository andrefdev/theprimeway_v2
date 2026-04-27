import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useUsers } from '@/features/users/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@repo/ui'
import { ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  createdAt: string | null
}

function UsersPage() {
  const { data, isLoading } = useUsers(1, 100)
  const navigate = useNavigate()

  const users: UserRow[] = data?.data || []

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name || <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant={row.original.role === 'admin' ? 'primary' : 'outline'}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const d = row.original.createdAt ? new Date(row.original.createdAt) : null
          const ok = d && !Number.isNaN(d.getTime())
          return (
            <span className="text-sm text-muted-foreground">
              {ok ? d!.toLocaleDateString() : '—'}
            </span>
          )
        },
        sortingFn: 'datetime',
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user subscriptions and feature access</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>Click a row to manage subscription and feature flags.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchPlaceholder="Search by email or name..."
              pageSize={20}
              empty="No users found"
              onRowClick={(u) => navigate({ to: '/users/$userId', params: { userId: u.id } })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/_admin/users/')({
  component: UsersPage,
})
