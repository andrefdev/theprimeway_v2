import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatInTz, localTimeToUtc } from '@repo/shared/utils'
import { useUserTimezone } from '@/features/settings/hooks/use-user-timezone'

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minuteStep?: number
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date & time',
  className,
  disabled,
  minuteStep = 15,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const tz = useUserTimezone()

  const hour = value ? Number(formatInTz(value, tz, 'HH')) : 9
  const minute = value ? Number(formatInTz(value, tz, 'mm')) : 0

  const minuteOptions: number[] = []
  for (let m = 0; m < 60; m += minuteStep) minuteOptions.push(m)

  function withTime(base: Date, h: number, m: number): Date {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return localTimeToUtc(base, `${hh}:${mm}`, tz)
  }

  function handleDateSelect(d: Date | undefined) {
    if (!d) {
      onChange?.(undefined)
      return
    }
    onChange?.(withTime(d, hour, minute))
  }

  function handleHour(h: number) {
    const base = value ?? new Date()
    onChange?.(withTime(base, h, minute))
  }

  function handleMinute(m: number) {
    const base = value ?? new Date()
    onChange?.(withTime(base, hour, m))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatInTz(value, tz, 'PPP · HH:mm') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleDateSelect} initialFocus />
        <div className="flex items-center gap-2 border-t p-3">
          <Select value={String(hour)} onValueChange={(v) => handleHour(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {String(i).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={String(minute)} onValueChange={(v) => handleMinute(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
