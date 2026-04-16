import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { gamificationQueries } from '@/features/gamification/queries'
import { format } from 'date-fns'
import type { GamificationProfile } from '@repo/shared/types'

export function ProfileGamificationStats() {
  const { t } = useTranslation('profile')
  const today = format(new Date(), 'yyyy-MM-dd')
  const profileQuery = useQuery(gamificationQueries.profile(today))
  const gamProfile = profileQuery.data?.data as GamificationProfile | undefined

  if (!gamProfile) {
    return null
  }

  return (
    <Card className="border-violet-500/20">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t('gamificationStats')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{gamProfile.level}</p>
            <p className="text-xs text-muted-foreground">{t('level')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{gamProfile.totalXp.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{gamProfile.currentStreak}</p>
            <p className="text-xs text-muted-foreground">{t('dayStreak')}</p>
          </div>
          <div className="text-center">
            <Badge className="text-sm capitalize">{gamProfile.rank}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{t('rank')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
