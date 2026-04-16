import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetQuarterlyReview } from '../queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { ClipboardCheck, TrendingUp, AlertTriangle, Target } from 'lucide-react'

function getCurrentQuarter(): { quarter: 1 | 2 | 3 | 4; year: number } {
  const now = new Date()
  const quarter = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4
  return { quarter, year: now.getFullYear() }
}

export function QuarterlyReviewCard() {
  const { t } = useTranslation('goals')
  const review = useGetQuarterlyReview()
  const [data, setData] = useState<{
    summary: string
    topAchievements: string[]
    stuckAreas: string[]
    proposedFocuses: string[]
  } | null>(null)

  const { quarter, year } = getCurrentQuarter()

  async function handleGenerate() {
    const result = await review.mutateAsync({ quarter, year })
    setData((result as any).data ?? result)
  }

  return (
    <Card className="border-violet-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('quarterlyReviewTitle', { defaultValue: `Q${quarter} ${year} Review` })}
            </h3>
          </div>
          {!data && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={review.isPending}
            >
              {review.isPending
                ? t('generating', { ns: 'common' })
                : t('generateReview', { defaultValue: 'Generate Review' })}
            </Button>
          )}
        </div>

        {review.isPending && <SkeletonList lines={3} />}

        {data && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{data.summary}</p>

            {data.topAchievements.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="size-3.5 text-green-500" />
                  <span className="text-xs font-medium text-foreground">
                    {t('topAchievements', { defaultValue: 'Top Achievements' })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.topAchievements.map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.stuckAreas.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-foreground">
                    {t('stuckAreas', { defaultValue: 'Areas Needing Attention' })}
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 ml-5 list-disc">
                  {data.stuckAreas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {data.proposedFocuses.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target className="size-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-foreground">
                    {t('proposedFocuses', { defaultValue: 'Suggested Focus Areas' })}
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 ml-5 list-disc">
                  {data.proposedFocuses.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
