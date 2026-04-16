import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { aiApi } from '../api'
import { toast } from 'sonner'
import { useFeature } from '@/features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'
import { BotMessageSquareIcon } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatPanel() {
  const { t, i18n } = useTranslation('ai')
  const aiFeature = useFeature(FEATURES.AI_ASSISTANT)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!aiFeature.enabled) return null

  async function handleSend(content: string) {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const payload = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
      const result = await aiApi.sendMessage(payload, i18n.language)
      const reply = result.response || t('noResponse')
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg lg:bottom-6"
          aria-label={t('title')}
        >
          <BotMessageSquareIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-500">
              AI
            </div>
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">{t('emptyState')}</p>
                <div className="flex flex-wrap justify-center gap-2">
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

        <div className="border-t px-4 py-3">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
