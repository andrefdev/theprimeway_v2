import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Skeleton,
  Badge,
} from '@repo/ui'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import type { RowSelectionState } from '@tanstack/react-table'
import { useAllUsers } from '@/features/users/queries'
import { useSendPush } from '@/features/notifications/queries'
import { DataTable } from '@/components/data-table'

type Target = 'all' | 'selected'

interface AdminUserRow {
  id: string
  email: string | null
  name: string | null
  role: string
}

function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [image, setImage] = useState('')
  const [target, setTarget] = useState<Target>('all')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const usersQuery = useAllUsers()
  const sendPush = useSendPush()

  const users: AdminUserRow[] = usersQuery.data?.data ?? []
  const total: number = usersQuery.data?.total ?? users.length

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (target === 'all' || selectedIds.length > 0) &&
    !sendPush.isPending

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      {
        accessorFn: (u) => u.name ?? u.email ?? u.id,
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.name ?? u.email ?? u.id}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
          )
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant={row.original.role === 'ADMIN' ? 'primary' : 'outline'}>
            {row.original.role.toLowerCase()}
          </Badge>
        ),
      },
    ],
    [],
  )

  async function handleSend() {
    if (!canSubmit) return
    const confirmMsg =
      target === 'all'
        ? 'Send this push notification to ALL users? This cannot be undone.'
        : `Send this push notification to ${selectedIds.length} user(s)?`
    if (!window.confirm(confirmMsg)) return

    try {
      const res = await sendPush.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        ...(url.trim() ? { url: url.trim() } : {}),
        ...(image.trim() ? { image: image.trim() } : {}),
        ...(target === 'selected' ? { userIds: selectedIds } : {}),
      })
      toast.success(
        `Sent to ${res.success_count} device(s) — ${res.failure_count} failed of ${res.total_devices ?? 0} total.`,
      )
      setTitle('')
      setBody('')
      setUrl('')
      setImage('')
      setRowSelection({})
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to send: ${message}`)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground">
          Send custom Firebase push notifications to all users or a specific subset.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
          <CardDescription>Delivered via FCM to registered web/mobile devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="push-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New feature available!"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="push-body" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Short, clear message users will see"
              maxLength={240}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="push-url" className="text-sm font-medium">
                Link URL (optional)
              </label>
              <Input
                id="push-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/dashboard"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="push-image" className="text-sm font-medium">
                Image URL (optional)
              </label>
              <Input
                id="push-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Recipients</legend>
            <div className="flex flex-col gap-2 md:flex-row md:gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target"
                  value="all"
                  checked={target === 'all'}
                  onChange={() => setTarget('all')}
                />
                All users
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target"
                  value="selected"
                  checked={target === 'selected'}
                  onChange={() => setTarget('selected')}
                />
                Specific users
              </label>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {target === 'selected' && (
        <Card>
          <CardHeader>
            <CardTitle>Select recipients</CardTitle>
            <CardDescription>
              {selectedIds.length} selected · {total} total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={users}
                searchPlaceholder="Search by name or email..."
                pageSize={10}
                empty="No users found"
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowId={(u) => u.id}
                stickyHeader
                maxHeight="28rem"
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={!canSubmit}>
          {sendPush.isPending ? 'Sending…' : 'Send notification'}
        </Button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_admin/notifications')({
  component: NotificationsPage,
})
