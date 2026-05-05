import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useBrainGraph } from '@/features/brain/queries'

// Lazy split: keeps three.js + react-force-graph-3d (~250KB gzipped) out of
// the main brain bundle. Only paid users who navigate to /brain/graph pull it.
const BrainGraph3D = lazy(() =>
  import('./BrainGraph3D').then((m) => ({ default: m.BrainGraph3D })),
)

export function BrainGraphContainer() {
  const { t } = useTranslation('brain')
  const { data, isLoading, error } = useBrainGraph()

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
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
      <CardContent className="p-0">
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <BrainGraph3D data={data} />
        </Suspense>
      </CardContent>
    </Card>
  )
}
