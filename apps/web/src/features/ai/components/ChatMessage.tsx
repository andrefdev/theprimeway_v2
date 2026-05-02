import { cn } from '@/shared/lib/utils'
import { Markdown } from './Markdown'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold',
          isUser
            ? 'rounded-full bg-primary text-primary-foreground'
            : 'rounded-lg bg-primary/15 text-primary',
        )}
      >
        {isUser ? 'U' : <FenrirGlyph className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap'
            : 'bg-muted text-foreground rounded-bl-md',
        )}
      >
        {isUser ? content : <Markdown content={content} />}
      </div>
    </div>
  )
}
