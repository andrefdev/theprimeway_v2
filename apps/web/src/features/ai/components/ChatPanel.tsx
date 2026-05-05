import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, History } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { FenrirLauncher } from './FenrirLauncher'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'
import { ChatHistoryList } from './ChatHistoryList'
import { ChatThreadView } from './ChatThreadView'
import { useFeature } from '@/features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'

export function ChatPanel() {
  const { t } = useTranslation('ai')
  const aiFeature = useFeature(FEATURES.AI_ASSISTANT)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined)

  if (!aiFeature.enabled) return null

  function handleSelectThread(id: string) {
    setActiveThreadId(id)
    setView('chat')
  }

  function handleNewChat() {
    setActiveThreadId(undefined)
    setView('chat')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <FenrirLauncher aria-label={t('title')} />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FenrirGlyph className="h-4 w-4" />
            </div>
            {t('title')}
          </SheetTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView(view === 'history' ? 'chat' : 'history')}
              aria-label={t('history')}
              title={t('history')}
              className="h-8 w-8"
            >
              <History className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              aria-label={t('newChat')}
              title={t('newChat')}
              className="h-8 w-8"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {view === 'history' ? (
          <ChatHistoryList activeThreadId={activeThreadId} onSelect={handleSelectThread} />
        ) : (
          <ChatThreadView
            key={activeThreadId ?? 'new'}
            threadId={activeThreadId}
            onThreadCreated={setActiveThreadId}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
