import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { calendarApi } from '@/features/calendar/api'
import {
  useChannels,
  useContexts,
  useCreateChannel,
  useCreateContext,
  useDeleteChannel,
  useDeleteContext,
  useSeedDefaults,
  useUpdateChannel,
  useUpdateContext,
} from '../queries'
import type { Channel, Context } from '../api'

export function ChannelsManager() {
  const contextsQuery = useContexts()
  const channelsQuery = useChannels()
  const seedDefaults = useSeedDefaults()

  const loading = contextsQuery.isLoading || channelsQuery.isLoading
  const contexts = contextsQuery.data ?? []
  const channels = channelsQuery.data ?? []

  const channelsByContext = useMemo(() => {
    const map = new Map<string, Channel[]>()
    for (const ch of channels) {
      if (!map.has(ch.contextId)) map.set(ch.contextId, [])
      map.get(ch.contextId)!.push(ch)
    }
    return map
  }, [channels])

  async function handleSeed() {
    try {
      await seedDefaults.mutateAsync()
      toast.success('Default contexts & channels created')
    } catch (err) {
      toast.error((err as Error).message || 'Seed failed')
    }
  }

  return (
    <div>
      <SectionHeader
        sectionId="channels"
        title="Channels & Contexts"
        description="Organize your work. Link each channel to a Google Calendar to auto-publish scheduled sessions."
        actions={
          contexts.length === 0 && !loading ? (
            <Button onClick={handleSeed} disabled={seedDefaults.isPending}>
              {seedDefaults.isPending ? 'Seeding…' : 'Create defaults'}
            </Button>
          ) : null
        }
      />

      <div className="mx-auto max-w-4xl px-6 pb-6 space-y-6">
        {loading && <SkeletonList lines={6} />}

        {!loading && contexts.length === 0 && (
          <EmptyState
            title="No contexts yet"
            description="Contexts group related channels. Start by creating a Work and Personal context."
          />
        )}

        {!loading && contexts.length > 0 && (
          <div className="space-y-4">
            {contexts.map((ctx) => (
              <ContextCard
                key={ctx.id}
                context={ctx}
                channels={channelsByContext.get(ctx.id) ?? []}
              />
            ))}
            <CreateContextForm />
          </div>
        )}
      </div>
    </div>
  )
}

function ContextCard({ context, channels }: { context: Context; channels: Channel[] }) {
  const updateContext = useUpdateContext()
  const deleteContext = useDeleteContext()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(context.name)
  const [isPersonal, setIsPersonal] = useState(context.isPersonal)

  async function save() {
    try {
      await updateContext.mutateAsync({ id: context.id, body: { name, isPersonal } })
      setEditing(false)
      toast.success('Context updated')
    } catch (err) {
      toast.error((err as Error).message || 'Update failed')
    }
  }

  async function remove() {
    if (!confirm(`Delete context "${context.name}"? All channels inside will also be deleted.`)) return
    try {
      await deleteContext.mutateAsync(context.id)
      toast.success('Context deleted')
    } catch (err) {
      toast.error((err as Error).message || 'Delete failed')
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-muted/20 px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: context.color }} />
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 max-w-xs" />
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input type="checkbox" checked={isPersonal} onChange={(e) => setIsPersonal(e.target.checked)} />
              Personal
            </label>
            <Button size="sm" onClick={save} disabled={updateContext.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setName(context.name); setIsPersonal(context.isPersonal); setEditing(false) }}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: context.color }} />
              <span className="font-medium truncate">{context.name}</span>
              {context.isPersonal && <Badge variant="outline" className="text-[10px]">Personal</Badge>}
              <span className="text-xs text-muted-foreground">· {channels.length} channel{channels.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>Delete</Button>
            </div>
          </>
        )}
      </div>
      <div className="divide-y divide-border/30">
        {channels.map((ch) => <ChannelRow key={ch.id} channel={ch} />)}
        <CreateChannelForm contextId={context.id} />
      </div>
    </div>
  )
}

function ChannelRow({ channel }: { channel: Channel }) {
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()
  const accountsQuery = useQuery({
    queryKey: ['calendar', 'accounts'],
    queryFn: () => calendarApi.listAccounts(),
    staleTime: 60_000,
  })
  const calendars = useMemo(() => {
    const out: Array<{ id: string; label: string }> = []
    for (const acc of accountsQuery.data ?? []) {
      for (const cal of acc.calendars ?? []) {
        out.push({ id: cal.id, label: `${cal.name} (${acc.email ?? acc.provider})` })
      }
    }
    return out
  }, [accountsQuery.data])

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(channel.name)
  const [timeboxId, setTimeboxId] = useState<string>(channel.timeboxToCalendarId ?? '')

  async function save() {
    try {
      await updateChannel.mutateAsync({
        id: channel.id,
        body: { name, timeboxToCalendarId: timeboxId || null },
      })
      setEditing(false)
      toast.success('Channel updated')
    } catch (err) {
      toast.error((err as Error).message || 'Update failed')
    }
  }

  async function remove() {
    if (!confirm(`Delete channel "${channel.name}"?`)) return
    try {
      await deleteChannel.mutateAsync(channel.id)
      toast.success('Channel deleted')
    } catch (err) {
      toast.error((err as Error).message || 'Delete failed')
    }
  }

  const linkedCal = calendars.find((c) => c.id === channel.timeboxToCalendarId)

  if (editing) {
    return (
      <div className="px-4 py-3 space-y-2 bg-accent/10">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: channel.color }} />
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 max-w-xs" placeholder="#channel-name" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-32">Timebox to calendar:</span>
          <Select value={timeboxId || 'none'} onValueChange={(v) => setTimeboxId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-8 max-w-sm">
              <SelectValue placeholder="Select calendar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Don't sync</SelectItem>
              {calendars.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={save} disabled={updateChannel.isPending}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { setName(channel.name); setTimeboxId(channel.timeboxToCalendarId ?? ''); setEditing(false) }}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/20">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: channel.color }} />
        <span className="font-medium truncate">{channel.name}</span>
        {channel.isDefault && <Badge variant="outline" className="text-[10px]">default</Badge>}
        {linkedCal ? (
          <span className="text-xs text-muted-foreground truncate">→ {linkedCal.label}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">not linked</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>Delete</Button>
      </div>
    </div>
  )
}

function CreateContextForm() {
  const [name, setName] = useState('')
  const [isPersonal, setIsPersonal] = useState(false)
  const create = useCreateContext()

  async function submit() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), isPersonal })
      setName('')
      setIsPersonal(false)
      toast.success('Context created')
    } catch (err) {
      toast.error((err as Error).message || 'Create failed')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-card/20 p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New context name (e.g. Work, Personal, Side Project)"
        className="h-9"
      />
      <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
        <input type="checkbox" checked={isPersonal} onChange={(e) => setIsPersonal(e.target.checked)} />
        Personal
      </label>
      <Button size="sm" onClick={submit} disabled={!name.trim() || create.isPending}>
        {create.isPending ? 'Adding…' : 'Add context'}
      </Button>
    </div>
  )
}

function CreateChannelForm({ contextId }: { contextId: string }) {
  const [name, setName] = useState('')
  const create = useCreateChannel()

  async function submit() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ contextId, name: name.trim() })
      setName('')
    } catch (err) {
      toast.error((err as Error).message || 'Create failed')
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/10">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="New channel name (e.g. deepwork, hiring)"
        className="h-8"
      />
      <Button size="sm" variant="outline" onClick={submit} disabled={!name.trim() || create.isPending}>
        {create.isPending ? '…' : 'Add'}
      </Button>
    </div>
  )
}
