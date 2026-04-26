import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

interface ToolCallCardProps {
  toolName: string
  args: Record<string, unknown>
  state: 'call' | 'result' | 'partial-call'
  result?: unknown
  onAccept?: () => Promise<void> | void
  onReject?: () => void
  isBusy?: boolean
}

const LABELS: Record<string, { title: string; verb: string }> = {
  // reads
  listTasks: { title: 'List tasks', verb: '' },
  listHabits: { title: 'List habits', verb: '' },
  listGoals: { title: 'List goals', verb: '' },
  listCalendarEvents: { title: 'List calendar events', verb: '' },
  findFreeSlots: { title: 'Find free slots', verb: '' },
  // writes
  createTask: { title: 'Create task', verb: 'Create' },
  updateTask: { title: 'Update task', verb: 'Update' },
  deleteTask: { title: 'Delete task', verb: 'Delete' },
  completeTask: { title: 'Complete task', verb: 'Mark done' },
  createHabit: { title: 'Create habit', verb: 'Create' },
  updateHabit: { title: 'Update habit', verb: 'Update' },
  logHabit: { title: 'Log habit today', verb: 'Log' },
  createGoal: { title: 'Create goal', verb: 'Create' },
  updateGoalProgress: { title: 'Update goal progress', verb: 'Update' },
  createTimeBlock: { title: 'Schedule time block', verb: 'Schedule' },
  startPomodoro: { title: 'Start pomodoro', verb: 'Start' },
}

const READ_ONLY_TOOLS = new Set([
  'listTasks',
  'listHabits',
  'listGoals',
  'listCalendarEvents',
  'findFreeSlots',
])

export function ToolCallCard({
  toolName,
  args,
  state,
  result,
  onAccept,
  onReject,
  isBusy,
}: ToolCallCardProps) {
  const [error, setError] = useState<string | null>(null)
  const label = LABELS[toolName] ?? { title: toolName, verb: 'Run' }

  const isClientTool = !READ_ONLY_TOOLS.has(toolName)
  const isResolved = state === 'result'
  const resultStatus = isResolved
    ? ((result as any)?.rejected
        ? 'rejected'
        : (result as any)?.error
          ? 'error'
          : 'success')
    : null

  async function handleAccept() {
    setError(null)
    try {
      await onAccept?.()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to execute action')
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-4 py-3 text-sm',
        resultStatus === 'success' && 'border-emerald-500/30',
        resultStatus === 'rejected' && 'border-muted',
        resultStatus === 'error' && 'border-destructive/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {toolName}
          </Badge>
          <span className="text-sm font-medium text-foreground">{label.title}</span>
        </div>
        {isResolved && (
          <span
            className={cn(
              'text-xs font-medium',
              resultStatus === 'success' && 'text-emerald-500',
              resultStatus === 'rejected' && 'text-muted-foreground',
              resultStatus === 'error' && 'text-destructive',
            )}
          >
            {resultStatus === 'success' && 'Applied'}
            {resultStatus === 'rejected' && 'Rejected'}
            {resultStatus === 'error' && 'Failed'}
          </span>
        )}
      </div>

      {Object.keys(args).length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {Object.entries(args).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-foreground break-words">{formatValue(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {isClientTool && !isResolved && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleAccept} disabled={isBusy}>
            <CheckIcon className="size-3.5" /> {label.verb}
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject} disabled={isBusy}>
            <XIcon className="size-3.5" /> Reject
          </Button>
        </div>
      )}
    </div>
  )
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
