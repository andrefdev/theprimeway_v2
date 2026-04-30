import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ChevronDownIcon } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { CreateTaskInput } from '@repo/shared/validators'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'

interface Props {
  form: UseFormReturn<CreateTaskInput>
}

/**
 * Calendar-style date + start time + end time, mirrors EventEditDialog.
 * Writes to scheduledDate (yyyy-MM-dd) + scheduledStart/scheduledEnd (ISO).
 * Also keeps estimatedDuration in sync from start/end delta.
 */
export function DateTimeRangeField({ form }: Props) {
  const scheduledDate = form.watch('scheduledDate')
  const scheduledStart = form.watch('scheduledStart')
  const scheduledEnd = form.watch('scheduledEnd')

  const initialDate = parseLocalDate(scheduledDate) ?? (scheduledStart ? new Date(scheduledStart) : new Date())
  const [dateObj, setDateObj] = useState<Date>(initialDate)
  const [startTime, setStartTime] = useState(scheduledStart ? format(new Date(scheduledStart), 'HH:mm') : '09:00')
  const [endTime, setEndTime] = useState(scheduledEnd ? format(new Date(scheduledEnd), 'HH:mm') : '09:30')
  const [open, setOpen] = useState(false)

  // Sync down when form is reset externally.
  useEffect(() => {
    const d = parseLocalDate(scheduledDate)
    if (d) setDateObj(d)
    if (scheduledStart) setStartTime(format(new Date(scheduledStart), 'HH:mm'))
    if (scheduledEnd) setEndTime(format(new Date(scheduledEnd), 'HH:mm'))
  }, [scheduledDate, scheduledStart, scheduledEnd])

  function commit(d: Date, s: string, e: string) {
    const ymd = format(d, 'yyyy-MM-dd')
    const startISO = `${ymd}T${s}:00`
    const endISO = `${ymd}T${e}:00`
    form.setValue('scheduledDate', ymd)
    form.setValue('scheduledStart', startISO)
    form.setValue('scheduledEnd', endISO)
    form.setValue('isAllDay', false)
    const ms = new Date(endISO).getTime() - new Date(startISO).getTime()
    if (Number.isFinite(ms) && ms > 0) {
      form.setValue('estimatedDuration', Math.round(ms / 60_000))
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5 flex-1 min-w-[160px]">
        <Label htmlFor="task-date">Date</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="task-date"
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            >
              {format(dateObj, 'PPP')}
              <ChevronDownIcon size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={dateObj}
              captionLayout="dropdown"
              defaultMonth={dateObj}
              onSelect={(d) => {
                if (d) {
                  setDateObj(d)
                  commit(d, startTime, endTime)
                  setOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5 w-28">
        <Label htmlFor="task-start">Start</Label>
        <Input
          id="task-start"
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value)
            commit(dateObj, e.target.value, endTime)
          }}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
      <div className="space-y-1.5 w-28">
        <Label htmlFor="task-end">End</Label>
        <Input
          id="task-end"
          type="time"
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value)
            commit(dateObj, startTime, e.target.value)
          }}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
    </div>
  )
}

function parseLocalDate(s?: string): Date | undefined {
  if (!s) return undefined
  const ymd = s.includes('T') ? s.split('T')[0]! : s
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
