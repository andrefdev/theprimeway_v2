import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { ChatInput } from '@/features/ai/components/ChatInput'
import { BriefingCard } from '@/features/ai/components/BriefingCard'
import { ToolCallCard } from '@/features/ai/components/ToolCallCard'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'
import { useAuthStore } from '@/shared/stores/auth.store'
import { tasksApi } from '@/features/tasks/api'
import { habitsApi } from '@/features/habits/api'
import { useQueryClient } from '@tanstack/react-query'
import { tasksQueries } from '@/features/tasks/queries'
import { habitsQueries } from '@/features/habits/queries'

export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
})

function AiPage() {
  const { t, i18n } = useTranslation('ai')
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null)

  const { messages, status, stop, append, addToolResult } = useChat({
    api: '/api/chat/stream',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: { locale: i18n.language },
    maxSteps: 5,
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
        default:
          result = { error: `Unknown tool: ${toolName}` }
      }
      addToolResult({ toolCallId, result })
    } catch (e: any) {
      addToolResult({ toolCallId, result: { error: e?.message ?? 'Failed to execute' } })
    } finally {
      setBusyToolCallId(null)
    }
  }

  function rejectTool(toolCallId: string) {
    addToolResult({ toolCallId, result: { rejected: true, reason: 'User rejected the action' } })
  }

  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')]

  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b px-6 py-3">
          <SectionHeader sectionId="ai" title={t('title')} description={t('subtitle')} />
        </div>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="mx-auto max-w-2xl space-y-4 py-6">
            {messages.length === 0 && (
              <div className="space-y-4">
                <BriefingCard />
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">&#x1F916;</div>
                  <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => append({ role: 'user', content: s })}
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
        </ScrollArea>

        <div className="border-t px-6 py-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <div className="flex-1">
              <ChatInput
                onSend={(v) => append({ role: 'user', content: v })}
                disabled={isLoading}
              />
            </div>
            {isLoading && (
              <Button variant="outline" size="sm" onClick={stop}>
                {t('stop', { defaultValue: 'Stop' })}
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
  onRejectTool: (toolCallId: string) => void
  busyToolCallId: string | null
}) {
  const isUser = message.role === 'user'
  const parts = (message.parts as any[]) ?? (message.content ? [{ type: 'text', text: message.content }] : [])

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
            return (
              <div
                key={idx}
                className={
                  isUser
                    ? 'ml-auto w-fit max-w-full rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground'
                    : 'rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap'
                }
              >
                {part.text}
              </div>
            )
          }
          if (part.type === 'tool-invocation') {
            const inv = part.toolInvocation
            return (
              <ToolCallCard
                key={idx}
                toolName={inv.toolName}
                args={inv.args ?? {}}
                state={inv.state}
                result={inv.state === 'result' ? inv.result : undefined}
                isBusy={busyToolCallId === inv.toolCallId}
                onAccept={() => onAcceptTool(inv.toolCallId, inv.toolName, inv.args)}
                onReject={() => onRejectTool(inv.toolCallId)}
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
