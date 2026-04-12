import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/components/section-header'
import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ChatMessage } from '../../features/ai/components/chat-message'
import { ChatInput } from '../../features/ai/components/chat-input'
import { BriefingCard } from '../../features/ai/components/briefing-card'
import { aiApi } from '../../features/ai/api'
import { FeatureGate } from '../../features/feature-flags/FeatureGate'
import { UpgradePrompt } from '../../features/subscriptions/components/upgrade-prompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function AiPage() {
  const { t, i18n } = useTranslation('ai')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(content: string) {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const payload = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
      const response = await aiApi.sendMessage(payload, i18n.language)
      const reply = response.data?.reply || t('noResponse')
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply },
      ])
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } }
      if (error.response?.status === 403) {
        toast.error(t('aiDisabled'))
      } else if (error.response?.status === 429) {
        toast.error(t('rateLimited'))
      } else {
        toast.error(t('failedToSend'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Header */}
        <div className="border-b px-6 py-3">
          <SectionHeader sectionId="ai" title={t('title')} description={t('subtitle')} />
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="mx-auto max-w-2xl space-y-4 py-6">
            {messages.length === 0 && (
              <div className="space-y-4">
                <BriefingCard />
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">&#x1F916;</div>
                  <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[t('suggestion1'), t('suggestion2'), t('suggestion3')].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
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
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {isLoading && (
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
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t px-6 py-3">
          <div className="mx-auto max-w-2xl">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </div>
      </div>
    </FeatureGate>
  )
}
