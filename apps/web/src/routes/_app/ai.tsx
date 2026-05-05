import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ChatHistoryList } from '@/features/ai/components/ChatHistoryList'
import { ChatThreadView } from '@/features/ai/components/ChatThreadView'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'

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
      <div className="flex h-full min-h-0">
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/20 md:flex">
          <div className="flex items-center justify-between border-b px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
                <FenrirGlyph className="h-3.5 w-3.5" />
              </div>
              {t('title')}
            </div>
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
          </div>
          <ChatHistoryList
            activeThreadId={activeThreadId}
            onSelect={(id) => setActiveThreadId(id)}
          />
        </aside>

        <section className="flex min-h-0 flex-1 flex-col">
          <ChatThreadView
            key={activeThreadId ?? 'new'}
            threadId={activeThreadId}
            onThreadCreated={(id) => setActiveThreadId(id)}
          />
        </section>
      </div>
    </FeatureGate>
  )
}
