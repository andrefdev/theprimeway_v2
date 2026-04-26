import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { TaskBucket } from '@repo/shared/types'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'

export interface DateBucketValue {
  scheduledDate?: string | null
  scheduledBucket?: TaskBucket | null
}

interface DateBucketPickerProps {
  value: DateBucketValue
  onChange: (next: DateBucketValue) => void
  className?: string
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayStr(): string {
  return formatLocalDate(new Date())
}

function tomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatLocalDate(d)
}

const PRESETS: Array<{
  key: string
  label: string
  value: DateBucketValue
}> = [
  { key: 'today', label: 'Today', value: { scheduledDate: todayStr(), scheduledBucket: 'TODAY' } },
  { key: 'tomorrow', label: 'Tomorrow', value: { scheduledDate: tomorrowStr(), scheduledBucket: 'TOMORROW' } },
  { key: 'next_week', label: 'Next week', value: { scheduledDate: null, scheduledBucket: 'NEXT_WEEK' } },
  { key: 'next_month', label: 'Next month', value: { scheduledDate: null, scheduledBucket: 'NEXT_MONTH' } },
  { key: 'someday', label: 'Someday', value: { scheduledDate: null, scheduledBucket: 'SOMEDAY' } },
  { key: 'no_date', label: 'No date', value: { scheduledDate: null, scheduledBucket: null } },
]

function activeKey(v: DateBucketValue): string | null {
  // Custom = scheduledDate set but doesn't match today/tomorrow
  if (v.scheduledDate) {
    if (v.scheduledDate === todayStr() && v.scheduledBucket === 'TODAY') return 'today'
    if (v.scheduledDate === tomorrowStr() && v.scheduledBucket === 'TOMORROW') return 'tomorrow'
    return 'custom'
  }
  if (v.scheduledBucket === 'NEXT_WEEK') return 'next_week'
  if (v.scheduledBucket === 'NEXT_MONTH') return 'next_month'
  if (v.scheduledBucket === 'SOMEDAY') return 'someday'
  return 'no_date'
}

function summary(v: DateBucketValue): string {
  const k = activeKey(v)
  if (k === 'custom' && v.scheduledDate) {
    const [y, m, d] = v.scheduledDate.split('-').map(Number) as [number, number, number]
    return format(new Date(y, m - 1, d), 'PPP')
  }
  const preset = PRESETS.find((p) => p.key === k)
  return preset?.label ?? 'Pick'
}

export function DateBucketPicker({ value, onChange, className }: DateBucketPickerProps) {
  const [open, setOpen] = React.useState(false)
  const k = activeKey(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 justify-start text-left font-normal', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {summary(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                onChange(p.value)
                setOpen(false)
              }}
              className={cn(
                'rounded-md px-3 py-2 text-left text-sm transition-colors',
                k === p.key
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'hover:bg-accent',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="px-1 pb-1 text-xs text-muted-foreground">Or pick a date</div>
          <Calendar
            mode="single"
            selected={
              value.scheduledDate
                ? (() => {
                    const [y, m, d] = value.scheduledDate.split('-').map(Number) as [number, number, number]
                    return new Date(y, m - 1, d)
                  })()
                : undefined
            }
            onSelect={(d) => {
              if (!d) {
                onChange({ scheduledDate: null, scheduledBucket: null })
              } else {
                onChange({ scheduledDate: formatLocalDate(d), scheduledBucket: null })
              }
              setOpen(false)
            }}
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
