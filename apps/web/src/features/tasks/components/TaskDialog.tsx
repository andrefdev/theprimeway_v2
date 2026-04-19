import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskSchema, type CreateTaskInput } from '@repo/shared/validators'
import type { Task } from '@repo/shared/types'
import { useCreateTask, useUpdateTask } from '../queries'
import { useScheduleSuggestion } from '../hooks/use-schedule-suggestion'
import { useEstimateTimebox } from '../hooks/use-estimate-timebox'
import { useScheduleTask } from '../queries'
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
import { DatePicker } from '@/shared/components/ui/date-picker'
import { DateTimePicker } from '@/shared/components/ui/date-time-picker'
import { Switch } from '@/shared/components/ui/switch'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
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
}

const PRIORITY_OPTIONS = [
  { value: 'low', color: 'text-blue-500' },
  { value: 'medium', color: 'text-yellow-500' },
  { value: 'high', color: 'text-red-500' },
] as const

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export function TaskDialog({ open, onClose, task, defaultDate }: TaskDialogProps) {
  const { t } = useTranslation('tasks')
  const { locale } = useLocale()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const estimateTimebox = useEstimateTimebox()
  const scheduleTask = useScheduleTask()
  const [showInsights, setShowInsights] = useState(false)
  const [showScheduleResult, setShowScheduleResult] = useState<{ start: string; end: string } | null>(null)
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
  const { data: scheduleSuggestion, isLoading: isSuggestionLoading } = useScheduleSuggestion(
    scheduledDate,
    estimatedDuration,
  )

  // Reset form when dialog opens with new task
  useEffect(() => {
    if (!open) return
    if (task) {
      const hasTimes = !!(task.scheduledStart && task.scheduledEnd)
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        scheduledDate: task.scheduledDate ?? undefined,
        scheduledStart: task.scheduledStart ?? undefined,
        scheduledEnd: task.scheduledEnd ?? undefined,
        isAllDay: (task as any).isAllDay ?? !hasTimes,
        estimatedDuration: task.estimatedDuration ?? undefined,
        tags: task.tags ?? [],
        weeklyGoalId: (task as any).weeklyGoalId ?? undefined,
      })
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        scheduledDate: defaultDate,
        isAllDay: true,
        estimatedDuration: undefined,
        tags: [],
      })
    }
  }, [open, task, defaultDate, form])

  async function onSubmit(data: CreateTaskInput) {
    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, data })
        toast.success(t('taskUpdated'))
      } else {
        await createTask.mutateAsync(data)
        toast.success(t('taskCreated'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? t('failedToUpdate') : t('failedToCreate'))
    }
  }

  const isPending = createTask.isPending || updateTask.isPending
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

              <div className="space-y-0 -mt-2">
                <div className="flex items-center justify-between">
                  <Label>{t('estimatedDuration')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const title = form.watch('title')
                      const description = form.watch('description')
                      if (!title) {
                        toast.error(t('enterTitleFirst'))
                        return
                      }
                      try {
                        const result = await estimateTimebox.mutateAsync({ title, description })
                        form.setValue('estimatedDuration', result.minutes)
                        toast.success(t('estimatedResult', { minutes: result.minutes, rationale: result.rationale }))
                      } catch {
                        toast.error(t('failedToEstimate'))
                      }
                    }}
                    disabled={estimateTimebox.isPending}
                    className="text-xs"
                  >
                    {estimateTimebox.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : t('suggest')}
                  </Button>
                </div>
                <Select
                  value={form.watch('estimatedDuration') ? String(form.watch('estimatedDuration')) : 'none'}
                  onValueChange={(v) => form.setValue('estimatedDuration', v !== 'none' ? Number(v) : undefined)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectDuration')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noDuration')}</SelectItem>
                    {DURATION_PRESETS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d >= 60 ? `${d / 60}h` : `${d}min`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduled Date / Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('scheduledDate')}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="isAllDay"
                      checked={form.watch('isAllDay') ?? true}
                      onCheckedChange={(v) => {
                        form.setValue('isAllDay', v)
                        if (v) {
                          form.setValue('scheduledStart', undefined)
                          form.setValue('scheduledEnd', undefined)
                        }
                      }}
                    />
                    <Label htmlFor="isAllDay" className="text-xs text-muted-foreground cursor-pointer">
                      {t('allDay')}
                    </Label>
                  </div>
                  {isEdit && task && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const result = await scheduleTask.mutateAsync({
                            taskId: task.id,
                            duration: form.watch('estimatedDuration'),
                          })
                          if (result.slot) {
                            setShowScheduleResult(result.slot)
                            const startDate = new Date(result.slot.start)
                            const year = startDate.getFullYear()
                            const month = String(startDate.getMonth() + 1).padStart(2, '0')
                            const day = String(startDate.getDate()).padStart(2, '0')
                            form.setValue('scheduledDate', `${year}-${month}-${day}`)
                            form.setValue('scheduledStart', result.slot.start)
                            form.setValue('scheduledEnd', result.slot.end)
                            form.setValue('isAllDay', false)
                            toast.success(t('foundOptimalSlot'))
                          } else {
                            toast.error(t('noSlotsFound'))
                          }
                        } catch {
                          toast.error(t('failedToFindSlot'))
                        }
                      }}
                      disabled={scheduleTask.isPending}
                      className="text-xs"
                    >
                      {scheduleTask.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : t('findBestTime')}
                    </Button>
                  )}
                </div>
              </div>

              {(form.watch('isAllDay') ?? true) ? (
                <DatePicker
                  date={parseLocalDate(form.watch('scheduledDate'))}
                  onDateChange={(d) => {
                    if (!d) {
                      form.setValue('scheduledDate', undefined)
                      return
                    }
                    const year = d.getFullYear()
                    const month = String(d.getMonth() + 1).padStart(2, '0')
                    const day = String(d.getDate()).padStart(2, '0')
                    form.setValue('scheduledDate', `${year}-${month}-${day}`)
                  }}
                  placeholder={t('pickDate')}
                  className="w-full"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('startTime')}</Label>
                    <DateTimePicker
                      value={form.watch('scheduledStart') ? new Date(form.watch('scheduledStart')!) : undefined}
                      onChange={(d) => {
                        if (!d) {
                          form.setValue('scheduledStart', undefined)
                          return
                        }
                        form.setValue('scheduledStart', d.toISOString())
                        const year = d.getFullYear()
                        const month = String(d.getMonth() + 1).padStart(2, '0')
                        const day = String(d.getDate()).padStart(2, '0')
                        form.setValue('scheduledDate', `${year}-${month}-${day}`)
                        const endStr = form.watch('scheduledEnd')
                        const duration = form.watch('estimatedDuration')
                        if (!endStr && duration) {
                          const end = new Date(d.getTime() + duration * 60_000)
                          form.setValue('scheduledEnd', end.toISOString())
                        }
                      }}
                      placeholder={t('pickDateTime')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('endTime')}</Label>
                    <DateTimePicker
                      value={form.watch('scheduledEnd') ? new Date(form.watch('scheduledEnd')!) : undefined}
                      onChange={(d) => {
                        form.setValue('scheduledEnd', d ? d.toISOString() : undefined)
                      }}
                      placeholder={t('pickDateTime')}
                      className="w-full"
                    />
                    {(() => {
                      const s = form.watch('scheduledStart')
                      const e = form.watch('scheduledEnd')
                      if (s && e && new Date(e) <= new Date(s)) {
                        return <p className="text-xs text-destructive">{t('endMustBeAfterStart')}</p>
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}
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
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground"
                    >
                      &times;
                    </button>
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
                <button
                  type="button"
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary w-full"
                >
                  <ChevronRightIcon
                    size={16}
                    className={`transition-transform ${showInsights ? 'rotate-90' : ''}`}
                  />
                  {t('aiInsights')}
                </button>
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
                                  <input
                                    type="checkbox"
                                    className="mt-0.5"
                                    onChange={(e) => {
                                      if (e.target.checked) {
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
              {isEdit ? t('saveChanges') : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function parseLocalDate(dateString?: string): Date | undefined {
  if (!dateString) return undefined
  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SSZ" formats
  const datePart = dateString.includes('T') ? dateString.split('T')[0]! : dateString
  const [year, month, day] = datePart.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}
