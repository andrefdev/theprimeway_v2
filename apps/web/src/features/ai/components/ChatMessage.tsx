import { cn } from '@/shared/lib/utils'
import { Markdown } from './Markdown'

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
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-violet-500/15 text-violet-500',
        )}
      >
        {isUser ? 'U' : 'AI'}
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
