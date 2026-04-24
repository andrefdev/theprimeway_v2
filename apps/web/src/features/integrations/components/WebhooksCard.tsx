import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Copy, Trash2 } from 'lucide-react'
import {
  useWebhooks,
  useWebhookEvents,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from '../queries'

export function WebhooksCard() {
  const { data: hooks = [], isLoading } = useWebhooks()
  const { data: allEvents = [] } = useWebhookEvents()
  const createMut = useCreateWebhook()
  const updateMut = useUpdateWebhook()
  const deleteMut = useDeleteWebhook()

  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState<string[]>(['task.completed'])

  function toggle(ev: string) {
    setSelected((s) => (s.includes(ev) ? s.filter((x) => x !== ev) : [...s, ev]))
  }

  async function onCreate() {
    if (!url.trim().startsWith('http') || selected.length === 0) return
    try {
      await createMut.mutateAsync({ url: url.trim(), events: selected, isActive: true })
      setUrl('')
      setSelected(['task.completed'])
      toast.success('Webhook created')
    } catch {
      toast.error('Failed to create webhook')
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this webhook?')) return
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Webhook deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateMut.mutateAsync({ id, input: { isActive } })
    } catch {
      toast.error('Update failed')
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied'),
      () => toast.error('Copy failed'),
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Webhooks</h3>
          <p className="text-xs text-muted-foreground">
            Receive POST notifications when events happen. Payloads are signed with HMAC-SHA256 in the <code className="font-mono">X-Primeway-Signature</code> header.
          </p>
        </div>

        <div className="space-y-2 rounded-md border border-border/50 p-3">
          <div className="space-y-1">
            <Label htmlFor="webhook-url" className="text-xs">Endpoint URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://example.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Events</Label>
            <div className="flex flex-wrap gap-1.5">
              {allEvents.map((ev) => {
                const active = selected.includes(ev)
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggle(ev)}
                    className={`rounded-md border px-2 py-1 text-xs font-mono transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    {ev}
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            onClick={onCreate}
            disabled={!url.trim().startsWith('http') || selected.length === 0 || createMut.isPending}
            className="w-full"
          >
            {createMut.isPending ? 'Creating…' : 'Add webhook'}
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : hooks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No webhooks yet.</p>
          ) : (
            hooks.map((h) => (
              <div key={h.id} className="rounded-md border border-border/50 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{h.url}</span>
                      {!h.isActive && <Badge variant="secondary" className="text-[10px]">paused</Badge>}
                      {h.lastDeliveryCode != null && (
                        <Badge
                          variant={h.lastDeliveryCode >= 200 && h.lastDeliveryCode < 300 ? 'outline' : 'destructive'}
                          className="text-[10px]"
                        >
                          last: {h.lastDeliveryCode || 'err'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {h.events.map((ev) => (
                        <code key={ev} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                          {ev}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(h.id, !h.isActive)}>
                      {h.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(h.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Signing secret:</span>
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-[10px]">
                    {h.secret}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copy(h.secret)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
