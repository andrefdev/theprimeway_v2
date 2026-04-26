import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskSchema, type CreateTaskInput, TASK_BUCKETS } from '@repo/shared/validators'
import type { Task, TaskBucket } from '@repo/shared/types'
import { channelsApi } from '@/features/capture/channels-api'
import { useCreateTask, useUpdateTask } from '../queries'
import { useScheduleSuggestion } from '../hooks/use-schedule-suggestion'
import { useEstimateTimebox } from '../hooks/use-estimate-timebox'
import { useCreateRecurring } from '@/features/recurring/queries'
import type { RecurrencePattern } from '@/features/recurring/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Hash, Check } from 'lucide-react'
import { DurationCombobox } from './DurationCombobox'
import { DateBucketPicker } from './DateBucketPicker'
import { Switch } from '@/shared/components/ui/switch'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { goalsQueries } from '@/features/goals/queries'
import { ChevronRightIcon } from '@/shared/components/Icons'
import { useLocale } from '@/i18n/useLocale'
import { formatTime } from '@/i18n/format'

interface TaskDialogProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStart?: string
  defaultEnd?: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', color: 'text-blue-500' },
  { value: 'medium', color: 'text-yellow-500' },
  { value: 'high', color: 'text-red-500' },
] as const

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export function TaskDialog({ open, onClose, task, defaultDate, defaultStart, defaultEnd }: TaskDialogProps) {
  const { t } = useTranslation('tasks')
  const { locale } = useLocale()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const createRecurring = useCreateRecurring()
  const estimateTimebox = useEstimateTimebox()
  const [showInsights, setShowInsights] = useState(false)
  const [showScheduleResult, setShowScheduleResult] = useState<{ start: string; end: string } | null>(null)
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatPattern, setRepeatPattern] = useState<RecurrencePattern>('DAILY')
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [repeatTime, setRepeatTime] = useState<string>('')
  const [repeatEnd, setRepeatEnd] = useState<string>('')
  const isEdit = !!task

  const {
    data: insight,
    isLoading: isInsightLoading,
    isError: isInsightError,
    refetch: refetchInsight,
  } = useQuery({
    ...tasksQueries.insight(task?.id || ''),
    enabled: isEdit && showInsights && !!task,
    retry: false,
  })

  const { data: weeklyGoalsData = [] } = useQuery({
    ...goalsQueries.weeklyGoals(),
  })

  const { data: channelsData = [] } = useQuery({
    queryKey: ['channels', 'list'],
    queryFn: channelsApi.list,
  })

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      scheduledDate: defaultDate,
      estimatedDuration: undefined,
      tags: [],
      weeklyGoalId: undefined,
    },
  })

  const scheduledDate = form.watch('scheduledDate')
  const estimatedDuration = form.watch('estimatedDuration')
  const title = form.watch('title')
  const description = form.watch('description')
  const { data: scheduleSuggestion, isLoading: isSuggestionLoading } = useScheduleSuggestion(
    scheduledDate,
    estimatedDuration,
  )

  const userTouchedDuration = useRef(false)
  const lastEstimatedTitle = useRef<string>('')

  // Auto-estimate duration as title is typed (debounced).
  useEffect(() => {
    if (!open || isEdit) return
    if (userTouchedDuration.current) return
    const trimmed = (title ?? '').trim()
    if (trimmed.length < 3) return
    if (trimmed === lastEstimatedTitle.current) return
    const handle = setTimeout(async () => {
      try {
        const result = await estimateTimebox.mutateAsync({ title: trimmed, description })
        if (!userTouchedDuration.current) {
          lastEstimatedTitle.current = trimmed
          form.setValue('estimatedDuration', result.minutes)
        }
      } catch {
        // silent — keep manual fallback via duration combobox
      }
    }, 700)
    return () => clearTimeout(handle)
  }, [title, description, open, isEdit, estimateTimebox, form])

  // Reset form when dialog opens with new task
  useEffect(() => {
    if (!open) return
    userTouchedDuration.current = false
    lastEstimatedTitle.current = ''
    setRepeatEnabled(false)
    setRepeatPattern('DAILY')
    setRepeatDays([1, 2, 3, 4, 5])
    setRepeatTime('')
    setRepeatEnd('')
    if (task) {
      const hasTimes = !!(task.scheduledStart && task.scheduledEnd)
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        scheduledDate: task.scheduledDate ?? undefined,
        scheduledStart: task.scheduledStart ?? undefined,
        scheduledEnd: task.scheduledEnd ?? undefined,
        scheduledBucket: (task as any).scheduledBucket ?? undefined,
        channelId: (task as any).channelId ?? undefined,
        isAllDay: (task as any).isAllDay ?? !hasTimes,
        estimatedDuration: task.estimatedDuration ?? undefined,
        tags: task.tags ?? [],
        weeklyGoalId: (task as any).weeklyGoalId ?? undefined,
      })
    } else {
      const hasTimes = !!(defaultStart && defaultEnd)
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        scheduledDate: defaultDate,
        scheduledStart: defaultStart,
        scheduledEnd: defaultEnd,
        scheduledBucket: undefined,
        channelId: undefined,
        isAllDay: !hasTimes,
        estimatedDuration: undefined,
        tags: [],
      })
    }
  }, [open, task, defaultDate, defaultStart, defaultEnd, form])

  async function onSubmit(data: CreateTaskInput) {
    try {
      // Auto-fill best time slot when user didn't set exact start/end.
      if (!data.scheduledStart && !data.scheduledEnd && data.scheduledDate && data.estimatedDuration && scheduleSuggestion) {
        data.scheduledStart = scheduleSuggestion.start
        data.scheduledEnd = scheduleSuggestion.end
        data.isAllDay = false
      }
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, data })
        toast.success(t('taskUpdated'))
      } else if (repeatEnabled) {
        if (repeatPattern === 'WEEKLY' && repeatDays.length === 0) {
          toast.error(t('selectAtLeastOneDay'))
          return
        }
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const startDate = data.scheduledDate || `${yyyy}-${mm}-${dd}`
        await createRecurring.mutateAsync({
          templateTaskJson: data as unknown as Record<string, unknown>,
          pattern: repeatPattern,
          daysOfWeek: repeatPattern === 'WEEKLY' ? repeatDays : undefined,
          atRoughlyTime: repeatTime || undefined,
          startDate,
          endDate: repeatEnd || undefined,
        })
        toast.success(t('seriesCreated'))
      } else {
        await createTask.mutateAsync(data)
        toast.success(t('taskCreated'))
      }
      onClose()
    } catch {
      toast.error(
        isEdit
          ? t('failedToUpdate')
          : repeatEnabled
            ? t('failedToCreateSeries')
            : t('failedToCreate'),
      )
    }
  }

  const isPending = createTask.isPending || updateTask.isPending || createRecurring.isPending
  const tags = form.watch('tags') ?? []

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    form.setValue('tags', [...tags, trimmed])
  }

  function removeTag(tag: string) {
    form.setValue('tags', tags.filter((t) => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? t('editTask') : t('createTask')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">{t('titleLabel')}</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder={t('titlePlaceholder')}
                autoFocus
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{t('titleRequired')}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </div>

            {/* Priority + Estimated Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('priority')}</Label>
                <Select
                  value={form.watch('priority') ?? 'medium'}
                  onValueChange={(v) => form.setValue('priority', v as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.color}>
                          {t(`priority_${opt.value}`)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{t('estimatedDuration')}</Label>
                  {estimateTimebox.isPending && (
                    <span className="text-[10px] text-muted-foreground">
                      {t('common:loading', { defaultValue: 'Loading...' })}
                    </span>
                  )}
                </div>
                <DurationCombobox
                  value={form.watch('estimatedDuration')}
                  onChange={(v) => {
                    userTouchedDuration.current = true
                    form.setValue('estimatedDuration', v)
                  }}
                  presets={DURATION_PRESETS}
                  placeholder={t('selectDuration')}
                />
              </div>
            </div>

            {/* When + Channel */}
            <div className="flex items-end gap-2">
              <div className="space-y-1.5 flex-1">
                <Label>{t('scheduledDate', { defaultValue: 'When' })}</Label>
                <DateBucketPicker
                  className="w-full"
                  value={{
                    scheduledDate: form.watch('scheduledDate') ?? null,
                    scheduledBucket: (form.watch('scheduledBucket') as TaskBucket | null | undefined) ?? null,
                  }}
                  onChange={(next) => {
                    form.setValue('scheduledDate', next.scheduledDate ?? undefined)
                    form.setValue('scheduledBucket', next.scheduledBucket ?? null)
                  }}
                />
              </div>
              {(() => {
                const channelId = form.watch('channelId')
                const selected = channelsData.find((c: any) => c.id === channelId)
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={selected ? `#${selected.name}` : t('selectChannel', { defaultValue: 'Channel' })}
                        className={selected ? 'text-primary' : 'text-muted-foreground'}
                      >
                        <Hash className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-1">
                      <button
                        type="button"
                        onClick={() => form.setValue('channelId', null)}
                        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <span className="text-muted-foreground">{t('none')}</span>
                        {!channelId && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {channelsData.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => form.setValue('channelId', c.id)}
                          className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <span>#{c.name}</span>
                          {channelId === c.id && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                      {channelsData.length === 0 && (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">
                          {t('noChannels', { defaultValue: 'No channels' })}
                        </p>
                      )}
                    </PopoverContent>
                  </Popover>
                )
              })()}
            </div>

            {/* Schedule Result */}
            {showScheduleResult && (
              <div className="space-y-1.5 p-3 rounded-lg bg-success/10 border border-success/30">
                <p className="text-xs font-semibold text-foreground">{t('suggestedTimeLabel')}</p>
                <p className="text-sm text-foreground">
                  {formatTime(showScheduleResult.start, locale)}
                  {' '}-{' '}
                  {formatTime(showScheduleResult.end, locale)}
                </p>
              </div>
            )}

            {/* Schedule Suggestion */}
            {scheduledDate && estimatedDuration && (
              <div className="space-y-1.5 p-3 rounded-lg bg-secondary/50 border border-border/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">{t('suggestedTime')}</Label>
                  {isSuggestionLoading && <span className="text-xs text-muted-foreground">{t('common:loading', { defaultValue: 'Loading...' })}</span>}
                </div>
                {scheduleSuggestion ? (
                  <div className="text-sm">
                    <p className="text-foreground font-medium">
                      {formatTime(scheduleSuggestion.start, locale)}
                      {' '}-{' '}
                      {formatTime(scheduleSuggestion.end, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('basedOnCalendar')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('noSlotAvailable')}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>{t('tags')}</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      &times;
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder={t('addTagPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>

            {/* Repeat */}
            {!isEdit && (
              <div className="space-y-2 rounded-lg border border-border/40 p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="repeatTask" className="cursor-pointer text-sm font-medium">
                    {t('repeatTask')}
                  </Label>
                  <Switch
                    id="repeatTask"
                    checked={repeatEnabled}
                    onCheckedChange={setRepeatEnabled}
                  />
                </div>
                {repeatEnabled && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t('repeatPattern')}</Label>
                      <Select
                        value={repeatPattern}
                        onValueChange={(v) => setRepeatPattern(v as RecurrencePattern)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">{t('daily')}</SelectItem>
                          <SelectItem value="WEEKDAYS">{t('weekdays')}</SelectItem>
                          <SelectItem value="WEEKLY">{t('weekly')}</SelectItem>
                          <SelectItem value="MONTHLY">{t('monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {repeatPattern === 'WEEKLY' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('repeatDays')}</Label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { v: 1, l: 'L' },
                            { v: 2, l: 'M' },
                            { v: 3, l: 'X' },
                            { v: 4, l: 'J' },
                            { v: 5, l: 'V' },
                            { v: 6, l: 'S' },
                            { v: 0, l: 'D' },
                          ].map((d) => {
                            const active = repeatDays.includes(d.v)
                            return (
                              <Button
                                key={d.v}
                                type="button"
                                variant={active ? 'default' : 'outline'}
                                size="icon"
                                onClick={() =>
                                  setRepeatDays(
                                    active ? repeatDays.filter((x) => x !== d.v) : [...repeatDays, d.v],
                                  )
                                }
                                className="text-xs font-medium"
                              >
                                {d.l}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('repeatTime')}</Label>
                        <Input
                          type="time"
                          value={repeatTime}
                          onChange={(e) => setRepeatTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('repeatEnd')}</Label>
                        <Input
                          type="date"
                          value={repeatEnd}
                          onChange={(e) => setRepeatEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">{t('repeatHint')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Weekly Goal */}
            <div className="space-y-1.5">
              <Label>{t('weeklyGoal')}</Label>
              <Select
                value={form.watch('weeklyGoalId') ?? 'none'}
                onValueChange={(v) => form.setValue('weeklyGoalId', v !== 'none' ? v : undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectWeeklyGoal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {Array.isArray(weeklyGoalsData) &&
                    weeklyGoalsData.map((goal: any) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Insights (for edit only) */}
            {isEdit && (
              <div className="space-y-1.5 border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInsights(!showInsights)}
                  className="w-full justify-start gap-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  <ChevronRightIcon
                    size={16}
                    className={`transition-transform ${showInsights ? 'rotate-90' : ''}`}
                  />
                  {t('aiInsights')}
                </Button>
                {showInsights && (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border/30 text-sm">
                    {isInsightLoading ? (
                      <p className="text-xs text-muted-foreground">{t('common:loading', { defaultValue: 'Loading...' })}</p>
                    ) : isInsightError ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-destructive">{t('insightsError')}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2"
                          onClick={() => refetchInsight()}
                        >
                          {t('retry')}
                        </Button>
                      </div>
                    ) : insight ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{t('context')}</p>
                          <p className="text-xs">{insight.contextBrief}</p>
                        </div>
                        {insight.suggestedSubtasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{t('suggestedSubtasks')}</p>
                            <ul className="space-y-1">
                              {insight.suggestedSubtasks.map((subtask, i) => (
                                <li key={i} className="text-xs flex items-start gap-2">
                                  <Checkbox
                                    className="mt-0.5"
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        addTag(subtask)
                                      }
                                    }}
                                  />
                                  <span>{subtask}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insight.tips.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{t('tips')}</p>
                            <ul className="space-y-1">
                              {insight.tips.map((tip, i) => (
                                <li key={i} className="text-xs">• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insight.suggestedGoalTitle && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{t('suggestedGoal')}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs flex-1">{insight.suggestedGoalTitle}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => form.setValue('weeklyGoalId', insight.suggestedGoalId)}
                              >
                                {t('apply')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t('noInsightsAvailable')}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit
                ? t('saveChanges')
                : repeatEnabled
                  ? t('createSeries', { defaultValue: 'Create series' })
                  : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function bucketLabel(b: string): string {
  switch (b) {
    case 'TODAY': return 'Today'
    case 'TOMORROW': return 'Tomorrow'
    case 'NEXT_WEEK': return 'Next week'
    case 'NEXT_MONTH': return 'Next month'
    case 'NEXT_QUARTER': return 'Next quarter'
    case 'NEXT_YEAR': return 'Next year'
    case 'SOMEDAY': return 'Someday'
    case 'NEVER': return 'Never'
    default: return b
  }
}

function parseLocalDate(dateString?: string): Date | undefined {
  if (!dateString) return undefined
  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats
  const datePart = dateString.includes('T') ? dateString.split('T')[0]! : dateString
  const [year, month, day] = datePart.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}
