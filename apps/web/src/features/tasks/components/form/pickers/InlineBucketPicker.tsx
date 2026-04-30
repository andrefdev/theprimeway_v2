import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon, Check as CheckIcon } from 'lucide-react'
import type { TaskBucket } from '@repo/shared/types'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { DatePicker } from '@/shared/components/ui/date-picker'

export type InlineBucketKey = TaskBucket | 'EXACT_DATE' | null

export interface InlineBucketValue {
  bucket: InlineBucketKey
  exactDate?: string
}

interface BucketOption {
  key: TaskBucket
  labelKey: string
  shortcut?: string
  fallback: string
}

const BUCKETS: BucketOption[] = [
  { key: 'TODAY', labelKey: 'composer.today', shortcut: 'T', fallback: 'Today' },
  { key: 'TOMORROW', labelKey: 'composer.tomorrow', fallback: 'Tomorrow' },
  { key: 'NEXT_WEEK', labelKey: 'composer.nextWeek', shortcut: 'W', fallback: 'in the next week' },
  { key: 'NEXT_MONTH', labelKey: 'composer.nextMonth', shortcut: 'M', fallback: 'in the next month' },
  { key: 'NEXT_QUARTER', labelKey: 'composer.nextQuarter', shortcut: 'Q', fallback: 'in the next quarter' },
  { key: 'NEXT_YEAR', labelKey: 'composer.nextYear', shortcut: 'Y', fallback: 'in the next year' },
  { key: 'SOMEDAY', labelKey: 'composer.someday', shortcut: 'S', fallback: 'someday' },
  { key: 'NEVER', labelKey: 'composer.never', shortcut: 'N', fallback: 'never' },
]

interface Props {
  value: InlineBucketValue
  onChange: (v: InlineBucketValue) => void
}

export function InlineBucketPicker({ value, onChange }: Props) {
  const { t } = useTranslation('tasks')

  function label() {
    if (value.bucket === 'EXACT_DATE' && value.exactDate) return value.exactDate
    if (!value.bucket) return t('composer.bucket', { defaultValue: 'When' })
    const b = BUCKETS.find((x) => x.key === value.bucket)
    return b ? t(b.labelKey, { defaultValue: b.fallback }) : t('composer.bucket', { defaultValue: 'When' })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <CalendarIcon className="size-3.5" />
          {label()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t('composer.setStartDate', { defaultValue: 'Set start date' })}
          />
          <CommandList>
            <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
            <CommandGroup>
              {BUCKETS.map((b) => {
                const active = value.bucket === b.key
                return (
                  <CommandItem
                    key={b.key}
                    value={b.key}
                    onSelect={() => onChange({ bucket: b.key })}
                    className={`flex items-center justify-between ${active ? 'bg-primary/10 text-primary aria-selected:bg-primary/15' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      {b.shortcut && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-[10px] font-semibold text-muted-foreground">
                          {b.shortcut}
                        </span>
                      )}
                      {t(b.labelKey, { defaultValue: b.fallback })}
                    </span>
                    {active && <CheckIcon className="size-3.5" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <div className="border-t border-border/40 p-2">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('composer.exactDate', { defaultValue: 'Schedule exact start date' })}
              </p>
              <DatePicker
                date={value.exactDate ? new Date(`${value.exactDate}T00:00:00`) : undefined}
                onDateChange={(d) => {
                  if (!d) return onChange({ bucket: null })
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const day = String(d.getDate()).padStart(2, '0')
                  onChange({ bucket: 'EXACT_DATE', exactDate: `${y}-${m}-${day}` })
                }}
                placeholder={t('composer.pickDate', { defaultValue: 'Pick a date' })}
                className="w-full"
              />
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
