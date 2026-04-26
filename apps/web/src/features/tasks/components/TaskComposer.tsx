import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TaskBucket } from '@repo/shared/types'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Textarea } from '@/shared/components/ui/textarea'
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
import { Calendar as CalendarIcon, Clock as ClockIcon, ArrowUp as ArrowUpIcon, Check as CheckIcon } from 'lucide-react'
import { TargetIcon } from '@/shared/components/Icons'
import { useCreateTask } from '../queries'
import { channelsApi } from '@/features/capture/channels-api'
import { goalsQueries } from '@/features/goals/queries'

type BucketKey = TaskBucket | 'EXACT_DATE' | null

interface BucketOption {
  key: TaskBucket
  labelKey: string
  hintKey: string
  shortcut?: string
}

const BUCKETS: BucketOption[] = [
  { key: 'TODAY', labelKey: 'composer.today', hintKey: 'composer.todayHint', shortcut: 'T' },
  { key: 'TOMORROW', labelKey: 'composer.tomorrow', hintKey: 'composer.tomorrowHint' },
  { key: 'NEXT_WEEK', labelKey: 'composer.nextWeek', hintKey: 'composer.nextWeekHint', shortcut: 'W' },
  { key: 'NEXT_MONTH', labelKey: 'composer.nextMonth', hintKey: 'composer.nextMonthHint', shortcut: 'M' },
  { key: 'NEXT_QUARTER', labelKey: 'composer.nextQuarter', hintKey: 'composer.nextQuarterHint', shortcut: 'Q' },
  { key: 'NEXT_YEAR', labelKey: 'composer.nextYear', hintKey: 'composer.nextYearHint', shortcut: 'Y' },
  { key: 'SOMEDAY', labelKey: 'composer.someday', hintKey: 'composer.somedayHint', shortcut: 'S' },
  { key: 'NEVER', labelKey: 'composer.never', hintKey: 'composer.neverHint', shortcut: 'N' },
]

const DURATION_PRESETS = [10, 15, 25, 30, 45, 60, 90, 120]

interface TaskComposerProps {
  defaultBucket?: TaskBucket | null
  onCreated?: () => void
  placeholder?: string
}

export function TaskComposer({ defaultBucket, onCreated, placeholder }: TaskComposerProps) {
  const { t } = useTranslation('tasks')
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [bucket, setBucket] = useState<BucketKey>(defaultBucket ?? 'TODAY')
  const [exactDate, setExactDate] = useState<string | undefined>()
  const [duration, setDuration] = useState<number | undefined>()
  const [channelId, setChannelId] = useState<string | undefined>()
  const [weeklyGoalId, setWeeklyGoalId] = useState<string | undefined>()

  const [bucketOpen, setBucketOpen] = useState(false)
  const [durationOpen, setDurationOpen] = useState(false)
  const [channelOpen, setChannelOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: channelsApi.list,
  })
  const { data: weeklyGoals = [] } = useQuery({ ...goalsQueries.weeklyGoals() })

  useEffect(() => {
    if (defaultBucket !== undefined) setBucket(defaultBucket ?? null)
  }, [defaultBucket])

  function bucketLabel(): string {
    if (bucket === 'EXACT_DATE' && exactDate) return exactDate
    if (!bucket) return t('composer.bucket', { defaultValue: 'When' })
    const found = BUCKETS.find((b) => b.key === bucket)
    return found ? t(found.labelKey, { defaultValue: bucketFallback(bucket) }) : bucketFallback(bucket)
  }

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      textareaRef.current?.focus()
      return
    }
    const payload: Record<string, unknown> = {
      title: trimmed,
      estimatedDuration: duration,
      channelId: channelId ?? null,
      weeklyGoalId,
    }
    if (bucket === 'EXACT_DATE' && exactDate) {
      payload.scheduledDate = exactDate
      payload.isAllDay = true
    } else if (bucket && bucket !== 'EXACT_DATE') {
      payload.scheduledBucket = bucket
      if (bucket === 'TODAY' || bucket === 'TOMORROW') {
        const d = new Date()
        if (bucket === 'TOMORROW') d.setDate(d.getDate() + 1)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        payload.scheduledDate = `${y}-${m}-${day}`
        payload.isAllDay = true
      }
    }

    try {
      await createTask.mutateAsync(payload as any)
      toast.success(t('taskCreated'))
      setTitle('')
      setDuration(undefined)
      setChannelId(undefined)
      setWeeklyGoalId(undefined)
      setExactDate(undefined)
      setBucket(defaultBucket ?? 'TODAY')
      onCreated?.()
      textareaRef.current?.focus()
    } catch {
      toast.error(t('failedToCreate'))
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Card className="rounded-xl bg-card/60 p-3 py-3 gap-3">
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t('composer.placeholder', { defaultValue: 'Task description…' })}
        rows={2}
        className="resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed placeholder:text-muted-foreground/70"
      />

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <Popover open={bucketOpen} onOpenChange={setBucketOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
              <CalendarIcon className="size-3.5" />
              {bucketLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('composer.setStartDate', { defaultValue: 'Set start date' })} />
              <CommandList>
                <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
                <CommandGroup>
                  {BUCKETS.map((b) => {
                    const isActive = bucket === b.key && bucket !== 'EXACT_DATE'
                    return (
                      <CommandItem
                        key={b.key}
                        value={b.key}
                        onSelect={() => {
                          setBucket(b.key)
                          setExactDate(undefined)
                          setBucketOpen(false)
                        }}
                        className={`flex items-center justify-between ${isActive ? 'bg-primary/10 text-primary aria-selected:bg-primary/15' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          {b.shortcut && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-[10px] font-semibold text-muted-foreground">
                              {b.shortcut}
                            </span>
                          )}
                          {t(b.labelKey, { defaultValue: bucketFallback(b.key) })}
                        </span>
                        {isActive && <CheckIcon className="size-3.5" />}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <div className="border-t border-border/40 p-2">
                  <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('composer.exactDate', { defaultValue: 'Schedule exact start date' })}
                  </p>
                  <DatePicker
                    date={exactDate ? new Date(`${exactDate}T00:00:00`) : undefined}
                    onDateChange={(d) => {
                      if (!d) {
                        setExactDate(undefined)
                        return
                      }
                      const y = d.getFullYear()
                      const m = String(d.getMonth() + 1).padStart(2, '0')
                      const day = String(d.getDate()).padStart(2, '0')
                      setExactDate(`${y}-${m}-${day}`)
                      setBucket('EXACT_DATE')
                      setBucketOpen(false)
                    }}
                    placeholder={t('composer.pickDate', { defaultValue: 'Pick a date' })}
                    className="w-full"
                  />
                </div>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={durationOpen} onOpenChange={setDurationOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
              <ClockIcon className="size-3.5" />
              {duration ? `${duration}m` : t('composer.timebox', { defaultValue: '--:--' })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('composer.minutes', { defaultValue: 'Minutes…' })} inputMode="numeric" />
              <CommandList>
                <CommandGroup>
                  {DURATION_PRESETS.map((p) => (
                    <CommandItem key={p} value={String(p)} onSelect={() => { setDuration(p); setDurationOpen(false) }}>
                      {p} min
                    </CommandItem>
                  ))}
                  {duration !== undefined && (
                    <CommandItem
                      value="clear"
                      onSelect={() => { setDuration(undefined); setDurationOpen(false) }}
                      className="text-muted-foreground"
                    >
                      {t('common:clear', { defaultValue: 'Clear' })}
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={channelOpen} onOpenChange={setChannelOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
              <span className="font-mono">#</span>
              {channelId ? channels.find((c) => c.id === channelId)?.name ?? 'channel' : t('composer.channel', { defaultValue: 'channel' })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('composer.searchChannel', { defaultValue: 'Search channel…' })} />
              <CommandList>
                <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
                <CommandGroup>
                  {channels.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => { setChannelId(c.id); setChannelOpen(false) }}
                    >
                      <span
                        className="mr-2 inline-block size-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </CommandItem>
                  ))}
                  {channelId && (
                    <CommandItem value="clear" onSelect={() => { setChannelId(undefined); setChannelOpen(false) }} className="text-muted-foreground">
                      {t('common:clear', { defaultValue: 'Clear' })}
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={goalOpen} onOpenChange={setGoalOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
              <TargetIcon size={14} />
              {weeklyGoalId
                ? (weeklyGoals as any[]).find((g) => g.id === weeklyGoalId)?.title?.slice(0, 18) ?? t('composer.goal', { defaultValue: 'goal' })
                : t('composer.goal', { defaultValue: 'goal' })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder={t('composer.searchGoal', { defaultValue: 'Search goal…' })} />
              <CommandList>
                <CommandEmpty>{t('common:noResults', { defaultValue: 'No results' })}</CommandEmpty>
                <CommandGroup>
                  {(weeklyGoals as any[]).map((g) => (
                    <CommandItem
                      key={g.id}
                      value={g.title}
                      onSelect={() => { setWeeklyGoalId(g.id); setGoalOpen(false) }}
                    >
                      {g.title}
                    </CommandItem>
                  ))}
                  {weeklyGoalId && (
                    <CommandItem value="clear" onSelect={() => { setWeeklyGoalId(undefined); setGoalOpen(false) }} className="text-muted-foreground">
                      {t('common:clear', { defaultValue: 'Clear' })}
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={createTask.isPending || !title.trim()}
            className="h-8 w-8 p-0 rounded-full"
            aria-label={t('composer.submit', { defaultValue: 'Add task' })}
          >
            <ArrowUpIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function bucketFallback(b: BucketKey): string {
  switch (b) {
    case 'TODAY': return 'Today'
    case 'TOMORROW': return 'Tomorrow'
    case 'NEXT_WEEK': return 'in the next week'
    case 'NEXT_MONTH': return 'in the next month'
    case 'NEXT_QUARTER': return 'in the next quarter'
    case 'NEXT_YEAR': return 'in the next year'
    case 'SOMEDAY': return 'someday'
    case 'NEVER': return 'never'
    case 'EXACT_DATE': return 'date'
    default: return 'When'
  }
}
