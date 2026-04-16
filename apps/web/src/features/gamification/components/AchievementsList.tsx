import { useQuery } from '@tanstack/react-query'
import { gamificationQueries } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { useTranslation } from 'react-i18next'
import type { Achievement } from '@repo/shared/types'

interface AchievementWithStatus extends Achievement {
  unlocked?: boolean
  unlockedAt?: string
}

export function AchievementsList() {
  const { t, i18n } = useTranslation('gamification')
  const locale = i18n.language
  const achievementsQuery = useQuery(gamificationQueries.achievements(locale))
  const achievements = (achievementsQuery.data?.data ?? []) as AchievementWithStatus[]

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  if (achievementsQuery.isLoading) return <SkeletonList lines={4} />

  if (achievements.length === 0) {
    return <EmptyState title={t('noAchievements')} description={t('noAchievementsDescription')} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('achievements')}</h3>
        <Badge variant="secondary" className="text-xs">
          {unlocked.length}/{achievements.length}
        </Badge>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {unlocked.map((a) => (
            <AchievementCard key={a.id} achievement={a} locale={locale} unlocked />
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
            {t('locked')}
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} locale={locale} unlocked={false} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AchievementCard({ achievement, locale, unlocked }: { achievement: AchievementWithStatus; locale: string; unlocked: boolean }) {
  const title = locale === 'es' ? achievement.titleEs : achievement.titleEn
  const description = locale === 'es' ? achievement.descriptionEs : achievement.descriptionEn

  return (
    <Card className={`transition-colors ${unlocked ? 'border-violet-500/30 bg-violet-500/5' : 'opacity-50'}`}>
      <CardContent className="flex items-center gap-3 p-3">
        <span className="text-2xl">{achievement.icon || '🏆'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{description}</p>
        </div>
        <Badge variant={unlocked ? 'default' : 'outline'} className="text-[9px] shrink-0">
          +{achievement.xpReward} XP
        </Badge>
      </CardContent>
    </Card>
  )
}
