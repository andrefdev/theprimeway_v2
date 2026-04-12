import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import type { GamificationProfile } from '@repo/shared/types'

// XP needed per level (simplified formula)
function xpForLevel(level: number): number {
  return level * 100
}

export function PlayerHUD() {
  const { t } = useTranslation('gamification')
  const today = format(new Date(), 'yyyy-MM-dd')
  const profileQuery = useQuery(gamificationQueries.profile(today))
  const profile = profileQuery.data?.data as GamificationProfile | undefined

  if (profileQuery.isLoading) return <SkeletonList lines={1} />
  if (!profile) return null

  const xpNeeded = xpForLevel(profile.level + 1)
  const xpInLevel = profile.totalXp % xpNeeded
  const levelProgress = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 0

  return (
    <Card>
      <CardContent className="p-4">
        {/* Top row: Level + Streak */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase text-muted-foreground">
              {(profile.rank ?? 'E').slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('level')} {profile.level}
              </p>
              {profile.title && (
                <p className="text-[10px] text-muted-foreground">{profile.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{profile.currentStreak}</p>
              <p className="text-[9px] text-muted-foreground">{t('streak')}</p>
            </div>

            <DailyGoalMini totalXp={profile.totalXp} dailyGoal={profile.dailyGoal} />
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{xpInLevel} / {xpNeeded} XP</span>
            <span>{t('level')} {profile.level + 1}</span>
          </div>
          <Progress value={levelProgress} className="h-1.5" />
        </div>

        {/* Total XP */}
        <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground">
          <span className="tabular-nums">
            {profile.totalXp.toLocaleString()} XP {t('total')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function DailyGoalMini({ totalXp, dailyGoal }: { totalXp: number; dailyGoal: number }) {
  const progress = dailyGoal > 0 ? Math.min((totalXp % dailyGoal) / dailyGoal * 100, 100) : 0
  const radius = 20
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
        <circle
          cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="3"
          className="text-foreground"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[9px] font-semibold text-foreground z-10">{Math.round(progress)}%</span>
    </div>
  )
}
