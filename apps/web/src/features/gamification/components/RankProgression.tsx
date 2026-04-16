import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { RankInfo } from '../api'

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const

const RANK_COLORS: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  E: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', ring: 'ring-gray-400', bar: 'bg-gray-400' },
  D: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-400', bar: 'bg-blue-500' },
  C: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-400', bar: 'bg-green-500' },
  B: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-400', bar: 'bg-purple-500' },
  A: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-400', bar: 'bg-orange-500' },
  S: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-500 dark:text-amber-400', ring: 'ring-red-500 dark:ring-amber-400', bar: 'bg-gradient-to-r from-red-500 to-amber-400' },
}

const RANK_NAME_KEYS: Record<string, string> = {
  E: 'rankE',
  D: 'rankD',
  C: 'rankC',
  B: 'rankB',
  A: 'rankA',
  S: 'rankS',
}

function rankIndex(rank: string): number {
  return RANKS.indexOf(rank as (typeof RANKS)[number])
}

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 100
  return Math.min(Math.round((current / target) * 100), 100)
}

export function RankProgression() {
  const { t } = useTranslation('gamification')
  const rankInfoQuery = useQuery(gamificationQueries.rankInfo())
  const rankInfo = rankInfoQuery.data?.data as RankInfo | undefined

  if (rankInfoQuery.isLoading) return <SkeletonList lines={3} />
  if (!rankInfo) return null

  const currentIdx = rankIndex(rankInfo.currentRank)
  const nextRank = rankInfo.nextRank
  const nextThresholds = nextRank ? rankInfo.thresholds[nextRank] : null

  const xpPct = nextThresholds ? progressPercent(rankInfo.progress.xp, nextThresholds.minXp) : 100
  const levelPct = nextThresholds ? progressPercent(rankInfo.progress.level, nextThresholds.minLevel) : 100
  const streakPct = nextThresholds ? progressPercent(rankInfo.progress.streak, nextThresholds.minStreak) : 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{t('rankProgression')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rank badges row */}
        <div className="flex items-center justify-between gap-1">
          {RANKS.map((rank, idx) => {
            const colors = RANK_COLORS[rank]!
            const isCurrent = idx === currentIdx
            const isPast = idx < currentIdx
            const isFuture = idx > currentIdx

            return (
              <div key={rank} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isCurrent && `${colors.bg} ${colors.text} ring-2 ${colors.ring} scale-110`,
                    isPast && `${colors.bg} ${colors.text} opacity-70`,
                    isFuture && 'bg-muted text-muted-foreground/40',
                  )}
                >
                  {isPast ? <Check className="h-3.5 w-3.5" /> : rank}
                </div>
                <span
                  className={cn(
                    'text-[9px] leading-tight',
                    isCurrent && `${colors.text} font-semibold`,
                    isPast && 'text-muted-foreground',
                    isFuture && 'text-muted-foreground/40',
                  )}
                >
                  {t(RANK_NAME_KEYS[rank]!)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Connecting line underneath badges */}
        <div className="relative mx-4 h-1 rounded-full bg-muted">
          <div
            className={cn(
              'absolute left-0 top-0 h-full rounded-full transition-all',
              RANK_COLORS[rankInfo.currentRank]?.bar ?? 'bg-gray-400',
            )}
            style={{ width: `${(currentIdx / (RANKS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Progress toward next rank */}
        {nextRank && nextThresholds ? (
          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t('progressToNextRank', { rank: `${nextRank} - ${t(RANK_NAME_KEYS[nextRank]!)}` })}
            </p>

            <ProgressRow
              label={t('xpRequired')}
              current={rankInfo.progress.xp}
              target={nextThresholds.minXp}
              percent={xpPct}
              format={(v) => v.toLocaleString()}
            />
            <ProgressRow
              label={t('levelRequired')}
              current={rankInfo.progress.level}
              target={nextThresholds.minLevel}
              percent={levelPct}
            />
            <ProgressRow
              label={t('streakRequired')}
              current={rankInfo.progress.streak}
              target={nextThresholds.minStreak}
              percent={streakPct}
              suffix="d"
            />
          </div>
        ) : (
          <p className="text-center text-xs font-medium text-amber-500">
            {t('maxRankReached')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** Compact version for use inside PlayerHUD or sidebar */
export function RankBadgeInline({ rank }: { rank: string }) {
  const { t } = useTranslation('gamification')
  const colors = RANK_COLORS[rank] ?? RANK_COLORS.E!

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
        colors.bg,
        colors.text,
      )}
    >
      {rank} - {t(RANK_NAME_KEYS[rank] ?? 'rankE')}
    </span>
  )
}

function ProgressRow({
  label,
  current,
  target,
  percent,
  format,
  suffix = '',
}: {
  label: string
  current: number
  target: number
  percent: number
  format?: (v: number) => string
  suffix?: string
}) {
  const fmt = format ?? ((v: number) => String(v))
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">
          {fmt(current)}{suffix} / {fmt(target)}{suffix}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  )
}
