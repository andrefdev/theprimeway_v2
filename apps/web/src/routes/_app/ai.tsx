import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
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
import { useExecuteTool } from '@/features/ai/hooks/useExecuteTool'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'

export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
})

function AiPage() {
  const { t } = useTranslation('ai')
  const token = useAuthStore((s) => s.token)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { execute, busyToolCallId } = useExecuteTool()

  const { messages, status, stop, sendMessage, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    onError: (err) => {
      const status = (err as { status?: number })?.status
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

  async function executeTool(toolCallId: string, toolName: string, args: unknown) {
    const output = await execute(toolCallId, toolName, args)
    addToolResult({ tool: toolName, toolCallId, output } as Parameters<typeof addToolResult>[0])
  }

  function rejectTool(toolCallId: string, toolName: string) {
    addToolResult({
      tool: toolName,
      toolCallId,
      output: { rejected: true, reason: 'User rejected the action' },
    } as Parameters<typeof addToolResult>[0])
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

interface MessagePart {
  type: string
  text?: string
  toolCallId?: string
  input?: unknown
  output?: unknown
  state?: string
}

interface ChatMessage {
  id: string
  role: string
  parts?: MessagePart[]
  content?: string
}

function MessageBubble({
  message,
  onAcceptTool,
  onRejectTool,
  busyToolCallId,
}: {
  message: ChatMessage
  onAcceptTool: (toolCallId: string, toolName: string, args: unknown) => void
  onRejectTool: (toolCallId: string, toolName: string) => void
  busyToolCallId: string | null
}) {
  const isUser = message.role === 'user'
  const parts: MessagePart[] =
    message.parts ?? (message.content ? [{ type: 'text', text: message.content }] : [])

  function mapToolState(s: string | undefined): 'call' | 'result' | 'partial-call' {
    if (s === 'output-available' || s === 'output-error') return 'result'
    if (s === 'input-streaming') return 'partial-call'
    return 'call'
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <FenrirGlyph className="h-4 w-4" />
        </div>
      )}
      <div className={`flex-1 space-y-2 ${isUser ? 'max-w-[80%]' : ''}`}>
        {parts.map((part, idx) => {
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
                <Markdown content={part.text ?? ''} />
              </div>
            )
          }
          if (typeof part.type === 'string' && part.type.startsWith('tool-') && part.type !== 'tool-error') {
            const toolName = part.type.slice(5)
            const toolCallId = part.toolCallId ?? ''
            const input = (part.input ?? {}) as Record<string, unknown>
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <FenrirGlyph className="h-4 w-4" />
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
