import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Brain, RefreshCw, X } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Button } from '@/shared/components/ui/button'
import { useBrainGraph, brainKeys } from '@/features/brain/queries'
import { GraphSearchBar } from './GraphSearchBar'
import { FocusedConceptPanel } from './FocusedConceptPanel'
import { cn } from '@/shared/lib/utils'

// Lazy split: keeps three.js + react-force-graph-3d (~250KB gzipped) out of
// the main brain bundle. Only paid users who navigate to /brain/graph pull it.
const BrainGraph3D = lazy(() =>
  import('./BrainGraph3D').then((m) => ({ default: m.BrainGraph3D })),
)

export function BrainGraphContainer() {
  const { t } = useTranslation('brain')
  const qc = useQueryClient()
  const { data, isLoading, error, isFetching } = useBrainGraph()
  const [focusedId, setFocusedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-destructive">
          {t('graph.error')}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.concepts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Brain className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t('graph.empty.title')}</p>
            <p className="text-xs text-muted-foreground">{t('graph.empty.description')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {t('graph.stats.concepts', { count: data.concepts.length })}
            <span className="px-1.5">·</span>
            {t('graph.stats.clusters', { count: data.clusters.length })}
          </span>
          {focusedId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => setFocusedId(null)}
            >
              <X className="h-3 w-3" />
              {t('graph.resetFocus')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <GraphSearchBar concepts={data.concepts} onSelect={(id) => setFocusedId(id)} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={t('graph.refresh')}
            onClick={() => qc.invalidateQueries({ queryKey: brainKeys.graph() })}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>
      <CardContent className="relative p-0">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <BrainGraph3D data={data} focusedId={focusedId} onFocus={setFocusedId} />
        </Suspense>
        {focusedId && (() => {
          const focused = data.concepts.find((c) => c.id === focusedId)
          if (!focused) return null
          return (
            <FocusedConceptPanel
              concept={focused}
              concepts={data.concepts}
              onClose={() => setFocusedId(null)}
              onMerged={(targetId) => setFocusedId(targetId)}
            />
          )
        })()}
      </CardContent>
    </Card>
  )
}
