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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { tasksQueries } from '../queries'
import { ChevronRightIcon } from '@/components/Icons'

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
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const estimateTimebox = useEstimateTimebox()
  const scheduleTask = useScheduleTask()
  const [showInsights, setShowInsights] = useState(false)
  const [showScheduleResult, setShowScheduleResult] = useState<{ start: string; end: string } | null>(null)
  const isEdit = !!task

  const { data: insight, isLoading: isInsightLoading } = useQuery({
    ...tasksQueries.insight(task?.id || ''),
    enabled: isEdit && showInsights && !!task,
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
    console.log('🗂️ TaskDialog - open:', open, 'defaultDate:', defaultDate, 'task:', task)
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        scheduledDate: task.scheduledDate ?? undefined,
        scheduledStart: task.scheduledStart ?? undefined,
        scheduledEnd: task.scheduledEnd ?? undefined,
        estimatedDuration: task.estimatedDuration ?? undefined,
        tags: task.tags ?? [],
      })
    } else {
      console.log('🗂️ TaskDialog - Resetting form with defaultDate:', defaultDate)
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        scheduledDate: defaultDate,
        estimatedDuration: undefined,
        tags: [],
      })
    }
  }, [open, task, defaultDate, form])

  async function onSubmit(data: CreateTaskInput) {
    console.log('📤 TaskDialog - Submitting task data:', data)
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
                        toast.error('Please enter a task title first')
                        return
                      }
                      try {
                        const result = await estimateTimebox.mutateAsync({ title, description })
                        form.setValue('estimatedDuration', result.minutes)
                        toast.success(`Estimated: ${result.minutes} min - ${result.rationale}`)
                      } catch {
                        toast.error('Failed to estimate duration')
                      }
                    }}
                    disabled={estimateTimebox.isPending}
                    className="text-xs"
                  >
                    {estimateTimebox.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : 'Suggest'}
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

            {/* Scheduled Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('scheduledDate')}</Label>
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
                          toast.success('Found optimal time slot!')
                        } else {
                          toast.error('No available time slots found')
                        }
                      } catch {
                        toast.error('Failed to find time slot')
                      }
                    }}
                    disabled={scheduleTask.isPending}
                    className="text-xs"
                  >
                    {scheduleTask.isPending ? t('common:loading', { defaultValue: 'Loading...' }) : 'Find best time'}
                  </Button>
                )}
              </div>
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
            </div>

            {/* Schedule Result */}
            {showScheduleResult && (
              <div className="space-y-1.5 p-3 rounded-lg bg-success/10 border border-success/30">
                <p className="text-xs font-semibold text-foreground">Suggested time:</p>
                <p className="text-sm text-foreground">
                  {new Date(showScheduleResult.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  {' '}-{' '}
                  {new Date(showScheduleResult.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
                      {new Date(scheduleSuggestion.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      {' '}-{' '}
                      {new Date(scheduleSuggestion.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
                  AI Insights
                </button>
                {showInsights && (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border/30 text-sm">
                    {isInsightLoading ? (
                      <p className="text-xs text-muted-foreground">{t('common:loading', { defaultValue: 'Loading...' })}</p>
                    ) : insight ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Context</p>
                          <p className="text-xs">{insight.contextBrief}</p>
                        </div>
                        {insight.suggestedSubtasks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Suggested Subtasks</p>
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
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Tips</p>
                            <ul className="space-y-1">
                              {insight.tips.map((tip, i) => (
                                <li key={i} className="text-xs">• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No insights available</p>
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
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  const [year, month, day] = datePart.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}
