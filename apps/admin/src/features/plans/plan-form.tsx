import { useState, type FormEvent } from 'react'
import { Button, Input, Select, Checkbox, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import type { Plan, PlanInput } from './api'

type FormState = Partial<PlanInput>

const BILLING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'lifetime', label: 'Lifetime' },
]

const BOOLEAN_FIELDS: Array<{ key: keyof PlanInput; label: string; description?: string }> = [
  { key: 'hasAiAssistant', label: 'AI Assistant' },
  { key: 'hasReadingModule', label: 'Reading Module' },
  { key: 'hasFinancesModule', label: 'Finances Module' },
  { key: 'hasNotesModule', label: 'Notes Module' },
  { key: 'hasAdvancedAnalytics', label: 'Advanced Analytics' },
  { key: 'hasCustomThemeCreation', label: 'Custom Theme Creation' },
  { key: 'hasExportData', label: 'Export Data' },
  { key: 'hasPrioritySupport', label: 'Priority Support' },
]

const LIMIT_FIELDS: Array<{ key: keyof PlanInput; label: string }> = [
  { key: 'maxHabits', label: 'Max Habits' },
  { key: 'maxGoals', label: 'Max Goals' },
  { key: 'maxNotes', label: 'Max Notes' },
  { key: 'maxTasks', label: 'Max Tasks' },
  { key: 'maxPomodoroSessionsDaily', label: 'Daily Pomodoro Sessions' },
]

function initialState(plan?: Plan): FormState {
  if (!plan) {
    return {
      name: '',
      displayName: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingInterval: 'monthly',
      trialPeriodDays: 14,
      maxHabits: 5,
      maxGoals: 3,
      maxNotes: 50,
      maxTasks: 20,
      maxPomodoroSessionsDaily: 10,
      hasAiAssistant: false,
      hasReadingModule: false,
      hasFinancesModule: false,
      hasNotesModule: false,
      hasAdvancedAnalytics: false,
      hasCustomThemeCreation: false,
      hasExportData: false,
      hasPrioritySupport: false,
      isActive: true,
      sortOrder: 0,
    }
  }
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = plan
  return rest
}

function toNumber(v: string): number | null {
  if (v === '' || v === '-') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

interface PlanFormProps {
  plan?: Plan
  submitLabel: string
  submitting?: boolean
  onSubmit: (input: Partial<PlanInput>) => void
  error?: string | null
}

export function PlanForm({ plan, submitLabel, submitting, onSubmit, error }: PlanFormProps) {
  const [state, setState] = useState<FormState>(() => initialState(plan))

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(state)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            label="Name (internal)"
            value={state.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="premium"
            required
          />
          <Input
            label="Display name"
            value={state.displayName ?? ''}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Premium"
            required
          />
          <Input
            label="Description"
            value={state.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Price"
            type="number"
            step="0.01"
            value={state.price ?? 0}
            onChange={(e) => set('price', toNumber(e.target.value) ?? 0)}
            required
          />
          <Input
            label="Currency"
            value={state.currency ?? 'USD'}
            onChange={(e) => set('currency', e.target.value.toUpperCase().slice(0, 3))}
            required
          />
          <Select
            label="Billing interval"
            value={state.billingInterval ?? 'monthly'}
            onChange={(e) => set('billingInterval', e.target.value as PlanInput['billingInterval'])}
            options={BILLING_OPTIONS}
          />
          <Input
            label="Sort order"
            type="number"
            value={state.sortOrder ?? 0}
            onChange={(e) => set('sortOrder', toNumber(e.target.value) ?? 0)}
          />
          <Input
            label="Trial period (days)"
            type="number"
            value={state.trialPeriodDays ?? 0}
            onChange={(e) => set('trialPeriodDays', toNumber(e.target.value))}
            description="0 = no trial"
          />
          <div className="md:col-span-2">
            <Checkbox
              label="Active"
              description="Inactive plans are hidden from checkout but preserved for history."
              checked={!!state.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lemon Squeezy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            label="Product ID"
            value={state.lemonSqueezyProductId ?? ''}
            onChange={(e) => set('lemonSqueezyProductId', e.target.value || null)}
          />
          <Input
            label="Variant ID (unique)"
            value={state.lemonSqueezyVariantId ?? ''}
            onChange={(e) => set('lemonSqueezyVariantId', e.target.value || null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {LIMIT_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              value={(state[f.key] as number | null | undefined) ?? ''}
              onChange={(e) => set(f.key, toNumber(e.target.value) as any)}
              description="-1 = unlimited, empty = inherit default"
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {BOOLEAN_FIELDS.map((f) => (
            <Checkbox
              key={f.key}
              label={f.label}
              checked={!!state[f.key]}
              onChange={(e) => set(f.key, e.target.checked as any)}
            />
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
