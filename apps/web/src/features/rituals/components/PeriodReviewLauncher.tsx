import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Calendar, Lock } from 'lucide-react'
import { useRitualsQuarter, useRitualsYear } from '../queries'
import { PeriodReviewDialog } from './PeriodReviewDialog'
import { periodReviewUnlockDate, periodReviewUnlocked } from '../lib/period-review-unlock'

function formatUnlock(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildSubLabel(
  periodKey: string | undefined,
  status: string | undefined,
  unlocked: boolean,
  unlockDate: Date | null,
) {
  const period = periodKey ?? '—'
  if (status === 'COMPLETED') return `${period} · done`
  if (!unlocked && unlockDate) return `${period} · unlocks ${formatUnlock(unlockDate)}`
  return period
}

export function PeriodReviewLauncher() {
  const { data: quarter } = useRitualsQuarter()
  const { data: year } = useRitualsYear()
  const [quarterOpen, setQuarterOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)

  const qReview = quarter?.review
  const yReview = year?.review

  const qUnlocked = qReview ? periodReviewUnlocked('QUARTERLY_REVIEW', qReview.scheduledFor) : false
  const yUnlocked = yReview ? periodReviewUnlocked('ANNUAL_REVIEW', yReview.scheduledFor) : false
  const qUnlockDate = qReview ? periodReviewUnlockDate('QUARTERLY_REVIEW', qReview.scheduledFor) : null
  const yUnlockDate = yReview ? periodReviewUnlockDate('ANNUAL_REVIEW', yReview.scheduledFor) : null

  const qCompleted = qReview?.status === 'COMPLETED'
  const yCompleted = yReview?.status === 'COMPLETED'

  const qDisabled = !qReview || (!qUnlocked && !qCompleted)
  const yDisabled = !yReview || (!yUnlocked && !yCompleted)

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold">Periodic reviews</h3>
        <p className="text-xs text-muted-foreground">
          Long-horizon rituals close the vision loop. Unlock near the period end so you can only complete them when it's actually time.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => setQuarterOpen(true)}
          disabled={qDisabled}
          className="justify-start"
        >
          {qDisabled && !qReview ? null : !qUnlocked && !qCompleted ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          <div className="text-left">
            <div className="text-sm font-medium">Quarterly</div>
            <div className="text-[11px] text-muted-foreground">
              {buildSubLabel(quarter?.periodKey, qReview?.status, qUnlocked, qUnlockDate)}
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => setYearOpen(true)}
          disabled={yDisabled}
          className="justify-start"
        >
          {yDisabled && !yReview ? null : !yUnlocked && !yCompleted ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          <div className="text-left">
            <div className="text-sm font-medium">Annual</div>
            <div className="text-[11px] text-muted-foreground">
              {buildSubLabel(year?.periodKey, yReview?.status, yUnlocked, yUnlockDate)}
            </div>
          </div>
        </Button>
      </div>

      {qReview && (
        <PeriodReviewDialog
          instance={qReview}
          open={quarterOpen}
          onClose={() => setQuarterOpen(false)}
          title="Quarterly Review"
          periodLabel={quarter!.periodKey}
          unlocked={qUnlocked}
          unlockDate={qUnlockDate}
        />
      )}
      {yReview && (
        <PeriodReviewDialog
          instance={yReview}
          open={yearOpen}
          onClose={() => setYearOpen(false)}
          title="Annual Review"
          periodLabel={year!.periodKey}
          unlocked={yUnlocked}
          unlockDate={yUnlockDate}
        />
      )}
      </CardContent>
    </Card>
  )
}
