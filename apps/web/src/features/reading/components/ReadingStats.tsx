import { useQuery } from '@tanstack/react-query'
import { readingQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'
import type { ReadingStats as ReadingStatsType } from '@repo/shared/types'

export function ReadingStats() {
  const { t } = useTranslation('reading')
  const statsQuery = useQuery(readingQueries.stats())
  const stats = (statsQuery.data?.data ?? {}) as unknown as ReadingStatsType

  if (statsQuery.isLoading) return <SkeletonList lines={1} />

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label={t('statsBooksRead')} value={stats.booksRead ?? 0} />
      <StatCard label={t('statsReading')} value={stats.booksReading ?? 0} />
      <StatCard label={t('statsToRead')} value={stats.booksToRead ?? 0} />
      <StatCard
        label={t('statsPagesRead')}
        value={(stats.totalPagesRead ?? 0).toLocaleString()}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
