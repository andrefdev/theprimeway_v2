import { useState } from 'react'
import type { FeatureKey, FeatureOverride } from '@/features/users/api'
import { useSetFeatureOverride, useDeleteFeatureOverride } from '@/features/users/queries'
import { Badge, Checkbox, Button, Input } from '@repo/ui'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FeatureOverrideRowProps {
  userId: string
  featureKey: FeatureKey
  planValue: number | boolean
  override?: Partial<FeatureOverride>
}

// Friendly names for features
const FEATURE_NAMES: Record<FeatureKey, string> = {
  AI_ASSISTANT: 'AI Assistant',
  READING_MODULE: 'Reading Module',
  FINANCES_MODULE: 'Finances Module',
  NOTES_MODULE: 'Notes Module',
  HEALTH_MODULE: 'Health Module',
  ADVANCED_ANALYTICS: 'Advanced Analytics',
  CUSTOM_THEME_CREATION: 'Custom Theme Creation',
  CUSTOM_THEMES: 'Custom Themes',
  EXPORT_DATA: 'Export Data',
  PRIORITY_SUPPORT: 'Priority Support',
  HABITS_LIMIT: 'Max Habits',
  GOALS_LIMIT: 'Max Goals',
  NOTES_LIMIT: 'Max Notes',
  TASKS_LIMIT: 'Max Tasks',
  POMODORO_DAILY_LIMIT: 'Daily Pomodoro Sessions',
}

export function FeatureOverrideRow({
  userId,
  featureKey,
  planValue,
  override,
}: FeatureOverrideRowProps) {
  const isNumeric = typeof planValue === 'number'
  const setOverride = useSetFeatureOverride()
  const deleteOverride = useDeleteFeatureOverride()
  const [overrideReason, setOverrideReason] = useState(override?.reason || '')
  const [showReasonInput, setShowReasonInput] = useState(!!override)

  const currentValue = override ? override.enabled : planValue
  const hasOverride = !!override

  async function handleToggle() {
    if (hasOverride) {
      await deleteOverride.mutateAsync({ userId, featureKey })
      setShowReasonInput(false)
      setOverrideReason('')
      toast.success('Override removed')
    } else {
      // When creating new override, enable it (disable if it was disabled)
      const newValue = typeof planValue === 'boolean' ? !planValue : true
      await setOverride.mutateAsync({
        userId,
        featureKey,
        enabled: newValue,
        reason: overrideReason || undefined,
      })
      toast.success('Override created')
    }
  }

  async function handleReasonChange() {
    if (override && override.enabled !== undefined) {
      await setOverride.mutateAsync({
        userId,
        featureKey,
        enabled: override.enabled as boolean,
        reason: overrideReason || undefined,
      })
      toast.success('Reason updated')
    }
  }

  const isLoading = setOverride.isPending || deleteOverride.isPending

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">{FEATURE_NAMES[featureKey]}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Plan default:
              {isNumeric ? ` ${planValue === -1 ? '∞' : planValue}` : ` ${planValue ? 'Enabled' : 'Disabled'}`}
            </span>
            {hasOverride && <Badge variant="primary">Override</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNumeric ? (
            <span className="font-mono text-lg font-semibold">
              {typeof currentValue === 'number' ? (currentValue === -1 ? '∞' : currentValue) : '—'}
            </span>
          ) : (
            <Checkbox
              checked={typeof currentValue === 'boolean' ? currentValue : false}
              disabled={isLoading}
            />
          )}
          <Button
            variant={hasOverride ? 'destructive' : 'outline'}
            size="sm"
            disabled={isLoading}
            onClick={handleToggle}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasOverride ? 'Clear' : 'Override'}
          </Button>
        </div>
      </div>

      {(hasOverride || showReasonInput) && (
        <div className="flex gap-2">
          <Input
            placeholder="Reason for override (optional)"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          {hasOverride && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReasonChange}
              disabled={isLoading || !overrideReason}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
