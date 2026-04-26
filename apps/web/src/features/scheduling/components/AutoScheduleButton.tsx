import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useAutoSchedule } from '../queries'
import type { SchedulingResult } from '../api'

interface Props {
  taskId: string
  /** yyyy-mm-dd */
  day: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'icon'
  preventSplit?: boolean
  iconOnly?: boolean
  tooltip?: string
}

export function AutoScheduleButton({
  taskId,
  day,
  label = 'Schedule',
  variant = 'outline',
  size = 'sm',
  preventSplit,
  iconOnly,
  tooltip = 'Auto-schedule in best slot',
}: Props) {
  const mutation = useAutoSchedule()

  async function run() {
    try {
      const result = await mutation.mutateAsync({ taskId, day, preventSplit })
      describe(result)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to schedule')
    }
  }

  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              className="h-8 w-8"
              disabled={mutation.isPending}
              onClick={run}
              aria-label={tooltip}
            >
              <CalendarClock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{mutation.isPending ? 'Scheduling…' : tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button variant={variant} size={size === 'icon' ? 'sm' : size} disabled={mutation.isPending} onClick={run}>
      <CalendarClock className="h-4 w-4" />
      {mutation.isPending ? 'Scheduling…' : label}
    </Button>
  )
}

function describe(result: SchedulingResult) {
  if (result.type === 'Success') {
    const n = result.sessions.length
    toast.success(n === 1 ? 'Scheduled' : `Scheduled (split into ${n} blocks)`)
    return
  }
  if (result.reason === 'NO_WORKING_HOURS') {
    toast.warning("No working hours for this day. Adjust your schedule or defer.")
  } else if (result.reason === 'NO_GAPS') {
    toast.warning('No available gaps today.')
  } else {
    toast.warning("Doesn't fit. Try another day or split manually.")
  }
}
