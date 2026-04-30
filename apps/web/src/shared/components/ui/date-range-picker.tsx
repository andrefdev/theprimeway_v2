import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DateRange as DayPickerRange } from 'react-day-picker'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  buildRange,
  formatRangeLabel,
  type DateRange,
  type DateRangePreset,
  DEFAULT_PRESETS,
} from '@/shared/lib/date-ranges'

interface DateRangePickerProps {
  value: DateRange
  onChange: (next: DateRange) => void
  presets?: DateRangePreset[]
  className?: string
  align?: 'start' | 'center' | 'end'
}

const PRESET_LABEL_KEYS: Record<DateRangePreset, string> = {
  today: 'dateRange.today',
  yesterday: 'dateRange.yesterday',
  this_week: 'dateRange.thisWeek',
  last_week: 'dateRange.lastWeek',
  this_month: 'dateRange.thisMonth',
  last_month: 'dateRange.lastMonth',
  last_7_days: 'dateRange.last7Days',
  last_30_days: 'dateRange.last30Days',
  last_90_days: 'dateRange.last90Days',
  this_year: 'dateRange.thisYear',
  last_year: 'dateRange.lastYear',
  all_time: 'dateRange.allTime',
  custom: 'dateRange.custom',
}

const DEFAULT_PRESET_FALLBACKS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_week: 'Last week',
  this_month: 'This month',
  last_month: 'Last month',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_90_days: 'Last 90 days',
  this_year: 'This year',
  last_year: 'Last year',
  all_time: 'All time',
  custom: 'Custom range',
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
  align = 'start',
}: DateRangePickerProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = React.useState(false)
  const [showCustom, setShowCustom] = React.useState(value.preset === 'custom')

  React.useEffect(() => {
    if (open) setShowCustom(value.preset === 'custom')
  }, [open, value.preset])

  const labelFor = (p: DateRangePreset) =>
    t(PRESET_LABEL_KEYS[p], { defaultValue: DEFAULT_PRESET_FALLBACKS[p] })

  const triggerLabel = formatRangeLabel(value, labelFor(value.preset))

  function selectPreset(preset: DateRangePreset) {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    onChange(buildRange(preset))
    setOpen(false)
  }

  const customSelected: DayPickerRange | undefined =
    value.preset === 'custom' && value.start && value.end
      ? { from: parseLocalDate(value.start), to: parseLocalDate(value.end) }
      : value.preset === 'custom' && value.start
        ? { from: parseLocalDate(value.start), to: undefined }
        : undefined

  function handleCustomSelect(r: DayPickerRange | undefined) {
    if (!r?.from) {
      onChange({ preset: 'custom', start: null, end: null })
      return
    }
    const start = formatLocalDate(r.from)
    const end = r.to ? formatLocalDate(r.to) : null
    onChange({ preset: 'custom', start, end })
    if (r.from && r.to) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 justify-start text-left font-normal', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align={align} side="bottom" sideOffset={4}>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 min-w-[160px]">
            {presets.map((p) => {
              const active = value.preset === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    active
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'hover:bg-accent border border-transparent',
                  )}
                >
                  {labelFor(p)}
                </button>
              )
            })}
          </div>

          {showCustom && (
            <div className="border-l pl-2">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={customSelected}
                onSelect={handleCustomSelect}
                defaultMonth={
                  customSelected?.from ?? new Date()
                }
                initialFocus
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={!(value.start && value.end)}
                >
                  {t('done', { defaultValue: 'Done' })}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
