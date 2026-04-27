import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Brain } from 'lucide-react'
import { useBrainFeed } from '@/features/brain/queries'
import { BrainCaptureCard } from '@/features/brain/components/BrainCaptureCard'
import { BrainEntryCard } from '@/features/brain/components/BrainEntryCard'
import { BrainEntryDetail } from '@/features/brain/components/BrainEntryDetail'
import { FeatureGate } from '@/features/feature-flags/FeatureGate'
import { UpgradePrompt } from '@/features/subscriptions/components/UpgradePrompt'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/brain')({
  component: BrainPage,
})

function BrainPage() {
  return (
    <FeatureGate
      feature={FEATURES.BRAIN_MODULE}
      fallback={<UpgradePrompt featureKey={FEATURES.BRAIN_MODULE} />}
    >
      <BrainPageContent />
    </FeatureGate>
  )
}

function BrainPageContent() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: entries = [], isLoading } = useBrainFeed({ search: search.trim() || undefined })

  return (
    <div>
      <SectionHeader sectionId="brain" title="Second Brain" />
      <div className="mx-auto max-w-6xl px-6 pb-10 space-y-4">
        <BrainCaptureCard />

        <div className="grid gap-4 md:grid-cols-[minmax(280px,360px)_1fr]">
          {/* Feed */}
          <div className="space-y-2">
            <Input
              placeholder="Search thoughts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            {isLoading ? (
              <p className="text-xs text-muted-foreground p-2">Loading…</p>
            ) : entries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Brain className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {search ? 'No matches.' : 'No thoughts yet. Capture your first above.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {entries.map((e) => (
                  <BrainEntryCard
                    key={e.id}
                    entry={e}
                    selected={e.id === selectedId}
                    onClick={() => setSelectedId(e.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <Card>
            <CardContent>
              {selectedId ? (
                <BrainEntryDetail entryId={selectedId} onDeleted={() => setSelectedId(null)} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                  <Brain className="h-6 w-6" />
                  <p className="text-sm">Pick a thought to see its structure and connections.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
