import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useAutoSchedule } from '../queries'
import type { SchedulingResult } from '../api'

interface Props {
  taskId: string
  /** yyyy-mm-dd */
  day: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default'
  preventSplit?: boolean
}

export function AutoScheduleButton({ taskId, day, label = 'Schedule', variant = 'outline', size = 'sm', preventSplit }: Props) {
  const mutation = useAutoSchedule()

  async function run() {
    try {
      const result = await mutation.mutateAsync({ taskId, day, preventSplit })
      describe(result)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to schedule')
    }
  }

  return (
    <Button variant={variant} size={size} disabled={mutation.isPending} onClick={run}>
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
