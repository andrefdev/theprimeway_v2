import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { aiApi, type WeeklyPlan } from '../api'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { CalendarDays, Clock } from 'lucide-react'
import { startOfWeek, format } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export function WeeklyPlanCard() {
  const { t } = useTranslation('common')
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)

  const generate = useMutation({
    mutationFn: () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      return aiApi.getWeeklyPlan(format(weekStart, 'yyyy-MM-dd'))
    },
    onSuccess: (result) => {
      setPlan(result)
    },
  })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('weeklyReview')}
            </h3>
          </div>
          {!plan && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending
                ? t('generating')
                : t('planYourWeek')}
            </Button>
          )}
        </div>

        {generate.isPending && <SkeletonList lines={4} />}

        {plan && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{plan.rationale}</p>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const items = plan.plan[day]
                if (!items?.length) return null
                return (
                  <div key={day}>
                    <span className="text-xs font-medium text-foreground">{day}</span>
                    <div className="mt-1 space-y-1 ml-3">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{item.title}</span>
                          {item.timeBlock && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              <Clock className="size-2.5 mr-0.5" />
                              {item.timeBlock}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
