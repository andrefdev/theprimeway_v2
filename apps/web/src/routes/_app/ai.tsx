import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { SquareIcon } from 'lucide-react'
import { ChatInput } from '@/features/ai/components/ChatInput'
import { ToolCallCard } from '@/features/ai/components/ToolCallCard'
import { Markdown } from '@/features/ai/components/Markdown'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'
import { useAuthStore } from '@/shared/stores/auth.store'
import { tasksApi } from '@/features/tasks/api'
import { habitsApi } from '@/features/habits/api'
import { goalsApi } from '@/features/goals/api'
import { calendarApi } from '@/features/calendar/api'
import { pomodoroApi } from '@/features/pomodoro/api'
import { schedulingApi } from '@/features/scheduling/api'
import { useQueryClient } from '@tanstack/react-query'
import { tasksQueries } from '@/features/tasks/queries'
import { habitsQueries } from '@/features/habits/queries'
import { goalsQueries } from '@/features/goals/queries'
import { calendarQueries } from '@/features/calendar/queries'
import { pomodoroQueries } from '@/features/pomodoro/queries'

export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
})

function AiPage() {
  const { t, i18n } = useTranslation('ai')
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null)

  const { messages, status, stop, sendMessage, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: { locale: i18n.language },
    }),
    onError: (err) => {
      const status = (err as any)?.status
      if (status === 403) toast.error(t('aiDisabled'))
      else if (status === 429) toast.error(t('rateLimited'))
      else toast.error(t('failedToSend'))
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const isLoading = status === 'streaming' || status === 'submitted'

  async function executeTool(toolCallId: string, toolName: string, args: any) {
    const addResult = (output: unknown) =>
      addToolResult({ tool: toolName, toolCallId, output } as any)
    setBusyToolCallId(toolCallId)
    try {
      let result: unknown
      switch (toolName) {
        case 'createTask': {
          const task = await tasksApi.create({
            title: args.title,
            description: args.description,
            priority: args.priority || 'medium',
            dueDate: args.dueDate,
            scheduledDate: args.scheduledDate,
          })
          result = { success: true, task: { id: (task as any).id, title: (task as any).title } }
          qc.invalidateQueries({ queryKey: tasksQueries.all() })
          toast.success(t('taskCreated', { ns: 'tasks', defaultValue: 'Task created' }))
          break
        }
        case 'completeTask': {
          const task = await tasksApi.update(args.taskId, { status: 'completed' })
          result = { success: true, task: { id: (task as any).id, status: 'completed' } }
          qc.invalidateQueries({ queryKey: tasksQueries.all() })
          toast.success(t('taskCompleted', { ns: 'tasks', defaultValue: 'Task completed' }))
          break
        }
        case 'createHabit': {
          const habit = await habitsApi.create({
            name: args.name,
            description: args.description,
            frequencyType: args.frequencyType || 'daily',
            targetFrequency: args.targetFrequency || 1,
          } as any)
          result = { success: true, habit: { id: (habit as any).id, name: (habit as any).name } }
          qc.invalidateQueries({ queryKey: habitsQueries.all() })
          toast.success(t('habitCreated', { ns: 'habits', defaultValue: 'Habit created' }))
          break
        }
        case 'logHabit': {
          const today = new Date().toISOString().split('T')[0]!
          const log = await habitsApi.upsertLog(args.habitId, {
            date: today,
            completedCount: 1,
            notes: args.notes,
          } as any)
          result = { success: true, log: { id: (log as any).id } }
          qc.invalidateQueries({ queryKey: habitsQueries.all() })
          toast.success(t('habitLogged', { ns: 'habits', defaultValue: 'Habit logged' }))
          break
        }
        case 'updateTask': {
          const patch: Record<string, unknown> = {}
          for (const k of ['title', 'description', 'priority', 'dueDate', 'scheduledDate'] as const) {
            if (args[k] !== undefined) patch[k] = args[k]
          }
          const task = await tasksApi.update(args.taskId, patch as any)
          result = { success: true, task: { id: (task as any).id } }
          qc.invalidateQueries({ queryKey: tasksQueries.all() })
          toast.success(t('taskUpdated', { ns: 'tasks', defaultValue: 'Task updated' }))
          break
        }
        case 'deleteTask': {
          await tasksApi.delete(args.taskId)
          result = { success: true, taskId: args.taskId }
          qc.invalidateQueries({ queryKey: tasksQueries.all() })
          toast.success(t('taskDeleted', { ns: 'tasks', defaultValue: 'Task deleted' }))
          break
        }
        case 'updateHabit': {
          const patch: Record<string, unknown> = {}
          for (const k of ['name', 'description', 'targetFrequency', 'frequencyType', 'isActive'] as const) {
            if (args[k] !== undefined) patch[k] = args[k]
          }
          const habit = await habitsApi.update(args.habitId, patch as any)
          result = { success: true, habit: { id: (habit as any).id } }
          qc.invalidateQueries({ queryKey: habitsQueries.all() })
          toast.success(t('habitUpdated', { ns: 'habits', defaultValue: 'Habit updated' }))
          break
        }
        case 'createGoal': {
          let goal: any
          if (args.level === 'three-year') {
            goal = await goalsApi.createThreeYearGoal({
              visionId: args.visionId,
              area: args.area || 'lifestyle',
              title: args.title,
              description: args.description,
            })
          } else if (args.level === 'annual') {
            goal = await goalsApi.createAnnualGoal({
              threeYearGoalId: args.threeYearGoalId,
              title: args.title,
              description: args.description,
              targetDate: args.targetDate,
            })
          } else {
            goal = await goalsApi.createQuarterlyGoal({
              annualGoalId: args.annualGoalId,
              year: args.year,
              quarter: args.quarter,
              title: args.title,
              description: args.description,
            })
          }
          result = { success: true, goal: { id: goal?.id, title: goal?.title ?? goal?.name, level: args.level } }
          qc.invalidateQueries({ queryKey: goalsQueries.all() })
          toast.success(t('goalCreated', { ns: 'goals', defaultValue: 'Goal created' }))
          break
        }
        case 'updateGoalProgress': {
          const goal = args.level === 'quarterly'
            ? await goalsApi.updateQuarterlyGoal(args.goalId, { progress: args.progress })
            : await goalsApi.updateAnnualGoal(args.goalId, { progress: args.progress })
          result = { success: true, goal: { id: (goal as any).id, progress: (goal as any).progress, level: args.level } }
          qc.invalidateQueries({ queryKey: goalsQueries.all() })
          toast.success(t('goalUpdated', { ns: 'goals', defaultValue: 'Goal updated' }))
          break
        }
        case 'createTimeBlock': {
          try {
            const browserTz =
              args.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
            const res = await calendarApi.createTimeBlock({
              title: args.title,
              date: args.date,
              startTime: args.startTime,
              endTime: args.endTime,
              description: args.description,
              timeZone: browserTz,
            })
            result = {
              success: true,
              eventId:
                (res as any)?.data?.eventId ?? (res as any)?.eventId,
            }
            qc.invalidateQueries({ queryKey: calendarQueries.all() })
            toast.success(t('timeBlockCreated', { ns: 'calendar', defaultValue: 'Time block scheduled' }))
          } catch (e: any) {
            const errMsg: string = e?.response?.data?.error ?? e?.data?.error ?? e?.message ?? ''
            if (/no_google_account|no_calendar|No Google Calendar/i.test(errMsg)) {
              toast.error(
                t('timeBlockNoGoogle', {
                  ns: 'calendar',
                  defaultValue: 'Connect Google Calendar in Settings → Integrations first',
                }),
              )
              result = { error: 'no_google_account' }
            } else {
              throw e
            }
          }
          break
        }
        case 'startPomodoro': {
          const session = await pomodoroApi.createSession({
            sessionType: 'focus',
            durationMinutes: args.durationMinutes,
            taskId: args.taskId,
            startedAt: new Date().toISOString(),
          } as any)
          result = { success: true, sessionId: (session as any).data?.id ?? (session as any).id }
          qc.invalidateQueries({ queryKey: pomodoroQueries.all() })
          toast.success(t('pomodoroStarted', { ns: 'pomodoro', defaultValue: 'Pomodoro started' }))
          break
        }
        case 'createHabitBlock': {
          try {
            const res = await calendarApi.createHabitBlock({
              habitId: args.habitId,
              habitName: args.habitName,
              startTime: args.startTime,
              endTime: args.endTime,
              frequencyType: args.frequencyType,
              weekDays: args.weekDays,
              description: args.description,
            })
            result = { success: true, eventId: (res as any)?.eventId }
            qc.invalidateQueries({ queryKey: calendarQueries.all() })
            qc.invalidateQueries({ queryKey: habitsQueries.all() })
            toast.success(t('habitBlockCreated', { ns: 'calendar', defaultValue: 'Habit block scheduled' }))
          } catch (e: any) {
            const errMsg: string = e?.response?.data?.error ?? e?.data?.error ?? e?.message ?? ''
            if (/no_google_account|no_calendar|No Google Calendar/i.test(errMsg)) {
              toast.error(
                t('timeBlockNoGoogle', {
                  ns: 'calendar',
                  defaultValue: 'Connect Google Calendar in Settings → Integrations first',
                }),
              )
              result = { error: 'no_google_account' }
            } else {
              throw e
            }
          }
          break
        }
        case 'autoScheduleTask': {
          const r = await schedulingApi.autoSchedule({
            taskId: args.taskId,
            day: args.day,
            preventSplit: args.preventSplit,
          })
          if ((r as any)?.type === 'Success') {
            result = { success: true, sessions: (r as any).sessions }
            qc.invalidateQueries({ queryKey: tasksQueries.all() })
            qc.invalidateQueries({ queryKey: calendarQueries.all() })
            toast.success(t('taskScheduled', { ns: 'tasks', defaultValue: 'Task scheduled' }))
          } else {
            result = { success: false, reason: (r as any)?.reason, options: (r as any)?.options }
            toast.error(
              t('taskScheduleFailed', {
                ns: 'tasks',
                defaultValue: 'Could not schedule task',
              }),
            )
          }
          break
        }
        case 'deleteHabit': {
          await habitsApi.delete(args.habitId)
          result = { success: true }
          qc.invalidateQueries({ queryKey: habitsQueries.all() })
          toast.success(t('habitDeleted', { ns: 'habits', defaultValue: 'Habit deleted' }))
          break
        }
        case 'deleteGoal': {
          if (args.level === 'three_year') await goalsApi.deleteThreeYearGoal(args.goalId)
          else if (args.level === 'annual') await goalsApi.deleteAnnualGoal(args.goalId)
          else if (args.level === 'quarterly') await goalsApi.deleteQuarterlyGoal(args.goalId)
          else if (args.level === 'weekly') await goalsApi.deleteWeeklyGoal(args.goalId)
          else throw new Error(`Unknown goal level: ${args.level}`)
          result = { success: true, level: args.level }
          qc.invalidateQueries({ queryKey: goalsQueries.all() })
          toast.success(t('goalDeleted', { ns: 'goals', defaultValue: 'Goal deleted' }))
          break
        }
        default:
          result = { error: `Unknown tool: ${toolName}` }
      }
      addResult(result)
    } catch (e: any) {
      addResult({ error: e?.message ?? 'Failed to execute' })
    } finally {
      setBusyToolCallId(null)
    }
  }

  function rejectTool(toolCallId: string, toolName: string) {
    addToolResult({
      tool: toolName,
      toolCallId,
      output: { rejected: true, reason: 'User rejected the action' },
    } as any)
  }

  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')]

  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6"
        >
          <div className="mx-auto max-w-2xl space-y-4 py-6">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">&#x1F916;</div>
                  <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage({ text: s })}
                        className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onAcceptTool={executeTool}
                onRejectTool={rejectTool}
                busyToolCallId={busyToolCallId}
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <TypingIndicator />
            )}
          </div>
        </div>

        <div className="shrink-0 border-t bg-background px-6 py-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <div className="flex-1">
              <ChatInput
                onSend={(v) => sendMessage({ text: v })}
                disabled={isLoading}
              />
            </div>
            {isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={stop}
                aria-label={t('stop', { defaultValue: 'Stop' })}
                className="h-10 w-10 rounded-xl p-0"
              >
                <SquareIcon className="size-4 fill-current" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </FeatureGate>
  )
}

function MessageBubble({
  message,
  onAcceptTool,
  onRejectTool,
  busyToolCallId,
}: {
  message: any
  onAcceptTool: (toolCallId: string, toolName: string, args: any) => void
  onRejectTool: (toolCallId: string, toolName: string) => void
  busyToolCallId: string | null
}) {
  const isUser = message.role === 'user'
  const parts = (message.parts as any[]) ?? (message.content ? [{ type: 'text', text: message.content }] : [])

  function mapToolState(s: string): 'call' | 'result' | 'partial-call' {
    if (s === 'output-available' || s === 'output-error') return 'result'
    if (s === 'input-streaming') return 'partial-call'
    return 'call'
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-500">
          AI
        </div>
      )}
      <div className={`flex-1 space-y-2 ${isUser ? 'max-w-[80%]' : ''}`}>
        {parts.map((part: any, idx: number) => {
          if (part.type === 'text') {
            if (isUser) {
              return (
                <div
                  key={idx}
                  className="ml-auto w-fit max-w-full whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                >
                  {part.text}
                </div>
              )
            }
            return (
              <div
                key={idx}
                className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-foreground"
              >
                <Markdown content={part.text} />
              </div>
            )
          }
          if (typeof part.type === 'string' && part.type.startsWith('tool-') && part.type !== 'tool-error') {
            const toolName: string = part.type.slice(5)
            const toolCallId: string = part.toolCallId
            const input = part.input ?? {}
            const state = mapToolState(part.state)
            const result = state === 'result' ? part.output : undefined
            return (
              <ToolCallCard
                key={idx}
                toolName={toolName}
                args={input}
                state={state}
                result={result}
                isBusy={busyToolCallId === toolCallId}
                onAccept={() => onAcceptTool(toolCallId, toolName, input)}
                onReject={() => onRejectTool(toolCallId, toolName)}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-500">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
