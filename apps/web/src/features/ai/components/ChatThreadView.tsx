import { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SquareIcon, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '@/shared/stores/auth.store'
import { ChatInput } from './ChatInput'
import { Markdown } from './Markdown'
import { ToolCallCard } from './ToolCallCard'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'
import { aiQueries } from '../queries'
import { useExecuteTool } from '../hooks/useExecuteTool'
import type { PersistedChatMessage } from '../api'

export function persistedToUIMessages(msgs: PersistedChatMessage[]): UIMessage[] {
  return msgs.map((m) => {
    const parts: any[] = []
    if (m.content) parts.push({ type: 'text', text: m.content, state: 'done' })
    for (const tc of m.toolCalls ?? []) {
      parts.push({
        type: `tool-${tc.toolName}`,
        toolCallId: tc.toolCallId,
        state: 'output-available',
        input: tc.args ?? {},
        output: tc.result ?? null,
      })
    }
    return { id: m.id, role: m.role, parts } as unknown as UIMessage
  })
}

function freshSessionKey() {
  return `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function ChatThreadView({
  threadId,
  onThreadCreated,
}: {
  threadId: string | undefined
  onThreadCreated: (id: string) => void
}) {
  const queryClient = useQueryClient()
  // sessionKey is the React key for ChatSession AND useChat's internal id. It
  // must stay stable while a session is alive so that streaming is not aborted
  // mid-flight when a brand-new threadId arrives via X-Thread-Id.
  const [sessionKey, setSessionKey] = useState<string>(() => threadId ?? freshSessionKey())
  // Tracks the threadId we created during the current session. When the prop
  // threadId matches it, we don't refetch and we don't remount.
  const ownedThreadIdRef = useRef<string | null>(null)
  const lastThreadIdRef = useRef<string | undefined>(threadId)

  if (threadId !== lastThreadIdRef.current) {
    lastThreadIdRef.current = threadId
    if (threadId !== ownedThreadIdRef.current) {
      // External change (user clicked another thread or "new chat"). Force a
      // fresh session — the previous in-memory chat state is no longer valid.
      ownedThreadIdRef.current = null
      setSessionKey(threadId ?? freshSessionKey())
    }
  }

  const isOwnedLocalSession = !!threadId && threadId === ownedThreadIdRef.current

  const { data: thread, isLoading } = useQuery({
    ...aiQueries.thread(threadId),
    enabled: !!threadId && !isOwnedLocalSession,
  })

  // Gate the chat session mount on data availability so useChat receives the
  // correct initialMessages on its FIRST render. Skip this gate when the
  // thread was just born locally — its messages already live in useChat state.
  if (threadId && !isOwnedLocalSession && (isLoading || !thread)) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  const initialMessages = thread ? persistedToUIMessages(thread.messages) : undefined

  function handleThreadCreated(id: string) {
    ownedThreadIdRef.current = id
    // Show the brand-new thread in the sidebar immediately.
    queryClient.invalidateQueries({ queryKey: [...aiQueries.all(), 'threads'] })
    onThreadCreated(id)
  }

  return (
    <ChatSession
      key={sessionKey}
      sessionId={sessionKey}
      threadId={threadId}
      initialMessages={initialMessages}
      onThreadCreated={handleThreadCreated}
    />
  )
}

function ChatSession({
  sessionId,
  threadId,
  initialMessages,
  onThreadCreated,
}: {
  sessionId: string
  threadId: string | undefined
  initialMessages: UIMessage[] | undefined
  onThreadCreated: (id: string) => void
}) {
  const { t, i18n } = useTranslation('ai')
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { execute, busyToolCallId } = useExecuteTool()

  const threadIdRef = useRef(threadId)
  useEffect(() => {
    threadIdRef.current = threadId
  }, [threadId])

  const customFetch: typeof fetch = useCallback(
    async (input, init) => {
      const res = await fetch(input, init)
      const id = res.headers.get('X-Thread-Id')
      if (id && id !== threadIdRef.current) {
        threadIdRef.current = id
        onThreadCreated(id)
      }
      return res
    },
    [onThreadCreated],
  )

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat/stream',
        headers: () => {
          const tok = useAuthStore.getState().token
          const h: Record<string, string> = {}
          if (tok) h.Authorization = `Bearer ${tok}`
          return h
        },
        body: () => ({ threadId: threadIdRef.current, locale: i18n.language }),
        fetch: customFetch,
      }),
    [customFetch, i18n.language],
  )

  const { messages, sendMessage, status, addToolResult, stop } = useChat({
    transport,
    messages: initialMessages,
    id: sessionId,
    onError: (err) => {
      const errStatus = (err as { status?: number })?.status
      if (errStatus === 403) toast.error(t('aiDisabled'))
      else if (errStatus === 429) toast.error(t('rateLimited'))
      else toast.error(t('failedToSend'))
    },
  })

  // Refresh the sidebar threads list once the stream finishes so the title
  // generated server-side (fire-and-forget after onFinish) shows up. The small
  // delay gives the title model time to respond before we refetch.
  const prevStatusRef = useRef(status)
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status
    const wasActive = prev === 'streaming' || prev === 'submitted'
    if (wasActive && status === 'ready' && threadIdRef.current) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ai', 'threads'] })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, queryClient])

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
    <>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4">
        <div className="mx-auto w-full max-w-3xl space-y-4 py-4">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">{t('emptyState')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage({ text: s })}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg as unknown as ChatMessageView}
              onAcceptTool={executeTool}
              onRejectTool={rejectTool}
              busyToolCallId={busyToolCallId}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && <TypingIndicator />}
        </div>
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <div className="flex-1">
            <ChatInput onSend={(v) => sendMessage({ text: v })} disabled={isLoading} />
          </div>
          {isLoading && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => stop()}
              aria-label={t('stop', { defaultValue: 'Stop' })}
              className="h-10 w-10 rounded-xl"
            >
              <SquareIcon className="size-4 fill-current" />
            </Button>
          )}
        </div>
      </div>
    </>
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

interface ChatMessageView {
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
  message: ChatMessageView
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
          if (
            typeof part.type === 'string' &&
            part.type.startsWith('tool-') &&
            part.type !== 'tool-error'
          ) {
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
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}
