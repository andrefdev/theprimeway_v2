import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useAddReflection, useUpdateRitualInstance } from '../queries'
import type { RitualInstance, RitualStep } from '../api'

interface Props {
  instance: RitualInstance
  open: boolean
  onClose: () => void
  title: string
  /** Optional final step after prompts are answered. Receives a `complete` callback. */
  finalStep?: (ctx: { complete: (snapshot?: unknown) => Promise<void>; back: () => void }) => ReactNode
  /** Optional hint rendered above prompts. */
  hint?: ReactNode
}

export function PromptRitualDialog({ instance, open, onClose, title, finalStep, hint }: Props) {
  const prompts = useMemo(
    () => instance.ritual.steps.filter((s) => s.type === 'PROMPT' && s.key && s.text) as RitualStep[],
    [instance.ritual.steps],
  )
  const [idx, setIdx] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [onFinalStep, setOnFinalStep] = useState(false)
  const updateInstance = useUpdateRitualInstance()
  const addReflection = useAddReflection()

  useEffect(() => {
    if (open && instance.status === 'PENDING') {
      updateInstance
        .mutateAsync({ id: instance.id, body: { status: 'IN_PROGRESS', startedAt: new Date().toISOString() } })
        .catch(() => undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const current = prompts[idx]
  const totalSteps = prompts.length + (finalStep ? 1 : 0)
  const stepNumber = onFinalStep ? totalSteps : idx + 1

  async function saveAndAdvance() {
    if (!current) return
    const body = (values[current.key!] ?? '').trim()
    if (body) {
      try {
        await addReflection.mutateAsync({ ritualInstanceId: instance.id, promptKey: current.key!, body })
      } catch (err) {
        toast.error((err as Error).message || 'Failed to save')
        return
      }
    }
    if (idx + 1 < prompts.length) {
      setIdx(idx + 1)
    } else if (finalStep) {
      setOnFinalStep(true)
    } else {
      await complete()
    }
  }

  async function complete(snapshot?: unknown) {
    try {
      await updateInstance.mutateAsync({
        id: instance.id,
        body: {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          snapshot: snapshot ?? values,
        },
      })
      toast.success(`${title} complete`)
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to complete')
    }
  }

  async function skip() {
    try {
      await updateInstance.mutateAsync({ id: instance.id, body: { status: 'SKIPPED' } })
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to skip')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Step {stepNumber} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}

        {!onFinalStep && current && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{current.text}</p>
            <textarea
              autoFocus
              rows={3}
              value={values[current.key!] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [current.key!]: e.target.value }))}
              className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Optional…"
            />
            <div className="flex items-center justify-between">
              {idx === 0 ? (
                <Button variant="ghost" size="sm" onClick={skip}>Skip ritual</Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIdx(idx - 1)}>Back</Button>
              )}
              <Button onClick={saveAndAdvance} disabled={addReflection.isPending}>
                {idx + 1 < prompts.length ? 'Next' : finalStep ? 'Next' : 'Complete'}
              </Button>
            </div>
          </div>
        )}

        {onFinalStep && finalStep && finalStep({ complete, back: () => setOnFinalStep(false) })}
      </DialogContent>
    </Dialog>
  )
}
