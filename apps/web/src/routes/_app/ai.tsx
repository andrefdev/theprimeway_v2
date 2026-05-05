import { useState } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ChatHistoryList } from '@/features/ai/components/ChatHistoryList'
import { ChatThreadView } from '@/features/ai/components/ChatThreadView'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'

const aiSearchSchema = z.object({
  t: z.string().uuid().optional(),
})

export const Route = createFileRoute('/_app/ai')({
  component: AiPage,
  validateSearch: aiSearchSchema,
})

function AiPage() {
  const { t } = useTranslation('ai')
  const navigate = useNavigate({ from: '/ai' })
  const { t: activeThreadId } = useSearch({ from: '/_app/ai' })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  function setActiveThreadId(id: string | undefined) {
    navigate({
      search: (prev) => ({ ...prev, t: id }),
      replace: true,
    })
  }

  return (
    <FeatureGate
      feature={FEATURES.AI_ASSISTANT}
      fallback={<UpgradePrompt featureKey={FEATURES.AI_ASSISTANT} />}
    >
      <div className="relative flex h-full min-h-0 gap-3 overflow-hidden p-3">
        {sidebarCollapsed ? (
          <div className="flex w-12 shrink-0 flex-col items-center gap-2 rounded-md bg-card py-3 ring-1 ring-foreground/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              aria-label={t('expandHistory')}
              title={t('expandHistory')}
              className="h-8 w-8"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveThreadId(undefined)}
              aria-label={t('newChat')}
              title={t('newChat')}
              className="h-8 w-8"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : (
          <aside className="hidden h-full w-72 shrink-0 flex-col overflow-hidden rounded-md bg-card ring-1 ring-foreground/10 md:flex">
            <div className="flex h-12 shrink-0 items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('conversations')}
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveThreadId(undefined)}
                  aria-label={t('newChat')}
                  title={t('newChat')}
                  className="h-7 w-7"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                  aria-label={t('collapseHistory')}
                  title={t('collapseHistory')}
                  className="h-7 w-7"
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </div>
            </div>
            <ChatHistoryList
              activeThreadId={activeThreadId}
              onSelect={(id) => setActiveThreadId(id)}
            />
          </aside>
        )}

        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-card ring-1 ring-foreground/10">
          <ChatThreadView
            threadId={activeThreadId}
            onThreadCreated={(id) => setActiveThreadId(id)}
          />
        </section>
      </div>
    </FeatureGate>
  )
}
