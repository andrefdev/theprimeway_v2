import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Copy, Trash2 } from 'lucide-react'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../queries'

export function ApiKeysCard() {
  const { data: keys = [], isLoading } = useApiKeys()
  const createMut = useCreateApiKey()
  const revokeMut = useRevokeApiKey()

  const [name, setName] = useState('')
  const [justCreated, setJustCreated] = useState<{ plaintext: string; prefix: string } | null>(null)

  async function onCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const result = await createMut.mutateAsync(trimmed)
      setJustCreated({ plaintext: result.plaintext, prefix: result.prefix })
      setName('')
    } catch {
      toast.error('Failed to create API key')
    }
  }

  async function onRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    try {
      await revokeMut.mutateAsync(id)
      toast.success('API key revoked')
    } catch {
      toast.error('Failed to revoke')
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
          <h3 className="text-base font-semibold">API keys</h3>
          <p className="text-xs text-muted-foreground">
            Use these to call the Primeway API from scripts, Zapier, or other tools. Keys are shown once at creation — save them somewhere safe.
          </p>
        </div>

        {justCreated && (
          <div className="rounded-md border border-amber-400/40 bg-amber-500/5 p-3 space-y-2">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
              New key — copy now, it will not be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 font-mono text-xs">
                {justCreated.plaintext}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(justCreated.plaintext)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setJustCreated(null)}>
              I saved it
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="api-key-name" className="text-xs">Name</Label>
            <Input
              id="api-key-name"
              placeholder="e.g. Zapier, home-script"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreate()
              }}
            />
          </div>
          <Button onClick={onCreate} disabled={!name.trim() || createMut.isPending}>
            {createMut.isPending ? 'Creating…' : 'Create key'}
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-xs text-muted-foreground">No keys yet.</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-md border border-border/50 p-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{k.name}</span>
                    {k.revokedAt && <Badge variant="destructive" className="text-[10px]">revoked</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {k.prefix}…
                    {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · never used'}
                  </div>
                </div>
                {!k.revokedAt && (
                  <Button size="sm" variant="ghost" onClick={() => onRevoke(k.id)} disabled={revokeMut.isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
