import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Plus, Trash2, Save, X } from 'lucide-react'
import {
  useRitualsList,
  useCreateRitual,
  useUpdateRitual,
  useDeleteRitual,
} from '../queries'
import type { Ritual, RitualCadence, RitualKind, RitualStep } from '../api'

const KINDS: RitualKind[] = [
  'DAILY_PLAN',
  'DAILY_SHUTDOWN',
  'WEEKLY_PLAN',
  'WEEKLY_REVIEW',
  'QUARTERLY_REVIEW',
  'ANNUAL_REVIEW',
  'CUSTOM',
]

const CADENCES: RitualCadence[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND']

interface Draft {
  name: string
  kind: RitualKind
  cadence: RitualCadence
  scheduledTime: string
  steps: RitualStep[]
  isEnabled: boolean
}

function emptyDraft(): Draft {
  return {
    name: '',
    kind: 'CUSTOM',
    cadence: 'ON_DEMAND',
    scheduledTime: '',
    steps: [{ type: 'PROMPT', key: 'prompt_1', text: '' }],
    isEnabled: true,
  }
}

function fromRitual(r: Ritual): Draft {
  return {
    name: r.name,
    kind: r.kind,
    cadence: r.cadence as RitualCadence,
    scheduledTime: r.scheduledTime ?? '',
    steps: Array.isArray(r.steps) && r.steps.length > 0 ? r.steps : [{ type: 'PROMPT', key: 'prompt_1', text: '' }],
    isEnabled: r.isEnabled,
  }
}

export function RitualsManager() {
  const { data: all = [], isLoading } = useRitualsList()
  const createMut = useCreateRitual()
  const updateMut = useUpdateRitual()
  const deleteMut = useDeleteRitual()

  // Only user-owned rituals can be edited (userId !== null).
  const owned = all.filter((r) => r.userId != null)
  const system = all.filter((r) => r.userId == null)

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())

  useEffect(() => {
    if (editingId && editingId !== 'new') {
      const r = owned.find((x) => x.id === editingId)
      if (r) setDraft(fromRitual(r))
    } else if (editingId === 'new') {
      setDraft(emptyDraft())
    }
  }, [editingId, owned])

  function updateStep(idx: number, patch: Partial<RitualStep>) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))
  }

  function addStep() {
    setDraft((d) => ({
      ...d,
      steps: [...d.steps, { type: 'PROMPT', key: `prompt_${d.steps.length + 1}`, text: '' }],
    }))
  }

  function removeStep(idx: number) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }))
  }

  async function save() {
    if (!draft.name.trim() || draft.steps.length === 0) {
      toast.error('Name and at least one step required')
      return
    }
    try {
      const payload = {
        ...draft,
        name: draft.name.trim(),
        scheduledTime: draft.scheduledTime || undefined,
        steps: draft.steps.filter((s) => s.type !== 'PROMPT' || (s.text && s.text.trim())),
      }
      if (editingId === 'new') {
        await createMut.mutateAsync(payload)
        toast.success('Ritual created')
      } else if (editingId) {
        await updateMut.mutateAsync({ id: editingId, input: payload })
        toast.success('Ritual updated')
      }
      setEditingId(null)
    } catch {
      toast.error('Save failed')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this ritual? Existing instances stay but no new ones are generated.')) return
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Ritual deleted')
      if (editingId === id) setEditingId(null)
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Rituals</h3>
            <p className="text-xs text-muted-foreground">
              Customize your daily and weekly rituals. System defaults stay available but can be disabled.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditingId('new')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New
          </Button>
        </div>

        {editingId && (
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">
                {editingId === 'new' ? 'New ritual' : 'Edit ritual'}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Friday gratitude"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Kind</Label>
                <select
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as RitualKind })}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cadence</Label>
                <select
                  value={draft.cadence}
                  onChange={(e) => setDraft({ ...draft, cadence: e.target.value as RitualCadence })}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {CADENCES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Scheduled time (HH:MM, optional)</Label>
                <Input
                  value={draft.scheduledTime}
                  onChange={(e) => setDraft({ ...draft, scheduledTime: e.target.value })}
                  placeholder="08:00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Prompts</Label>
              <div className="space-y-2">
                {draft.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      value={(step as any).key ?? ''}
                      onChange={(e) => updateStep(idx, { key: e.target.value })}
                      placeholder="key"
                      className="w-32"
                    />
                    <Input
                      value={(step as any).text ?? ''}
                      onChange={(e) => updateStep(idx, { text: e.target.value })}
                      placeholder="Prompt text shown to user"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeStep(idx)} disabled={draft.steps.length === 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={addStep} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add prompt
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.isEnabled}
                  onChange={(e) => setDraft({ ...draft, isEnabled: e.target.checked })}
                />
                Enabled
              </label>
              <Button size="sm" onClick={save} disabled={createMut.isPending || updateMut.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your rituals</div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : owned.length === 0 ? (
            <p className="text-xs text-muted-foreground">None yet. Click "New" to create one.</p>
          ) : (
            owned.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-border/50 p-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{r.name}</span>
                    <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>
                    {!r.isEnabled && <Badge variant="secondary" className="text-[10px]">disabled</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.cadence.toLowerCase()}
                    {r.scheduledTime && ` · ${r.scheduledTime}`}
                    {' · '}{r.steps.length} prompt{r.steps.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(r.id)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {system.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System defaults</div>
            {system.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-border/30 bg-muted/30 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm truncate">{r.name}</span>
                  <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">read-only</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
