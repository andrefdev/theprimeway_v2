import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, History, MoreVertical } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('actions')}
                title={t('actions')}
                className="mr-7 h-8 w-8"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleNewChat}>
                <Plus className="mr-2 size-4" /> {t('newChat')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView(view === 'history' ? 'chat' : 'history')}
              >
                <History className="mr-2 size-4" /> {t('history')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SheetHeader>

        {view === 'history' ? (
          <ChatHistoryList activeThreadId={activeThreadId} onSelect={handleSelectThread} />
        ) : (
          <ChatThreadView
            threadId={activeThreadId}
            onThreadCreated={setActiveThreadId}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
