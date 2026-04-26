import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Textarea,
  Skeleton,
} from '@repo/ui'
import { toast } from 'sonner'
import { useUsers } from '@/features/users/queries'
import { useSendPush } from '@/features/notifications/queries'

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
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Record<string, AdminUserRow>>({})

  const usersQuery = useUsers(page, 20)
  const sendPush = useSendPush()

  const users: AdminUserRow[] = usersQuery.data?.data ?? []
  const total: number = usersQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / 20))

  const selectedIds = useMemo(() => Object.keys(selected), [selected])

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (target === 'all' || selectedIds.length > 0) &&
    !sendPush.isPending

  function toggleUser(user: AdminUserRow) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[user.id]) delete next[user.id]
      else next[user.id] = user
      return next
    })
  }

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
      setSelected({})
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Select recipients</CardTitle>
              <CardDescription>
                {selectedIds.length} selected · {total} total users
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-96 overflow-y-auto rounded-md border">
              {usersQuery.isLoading ? (
                <div className="space-y-2 p-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No users found.</p>
              ) : (
                <ul className="divide-y">
                  {users.map((u) => {
                    const checked = !!selected[u.id]
                    return (
                      <li key={u.id}>
                        <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleUser(u)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {u.name ?? u.email ?? u.id}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          {u.role === 'ADMIN' && (
                            <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                              admin
                            </span>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Page {page} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pageCount}
                    onClick={() => setPage(Math.min(pageCount, page + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
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
