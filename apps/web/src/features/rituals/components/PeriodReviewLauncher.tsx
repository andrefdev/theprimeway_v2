import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Calendar } from 'lucide-react'
import { useRitualsQuarter, useRitualsYear } from '../queries'
import { PeriodReviewDialog } from './PeriodReviewDialog'

/**
 * Manual trigger card for Quarterly + Annual reviews. Always available
 * on the Vision surface so users can open the dialog outside the auto-open window.
 */
export function PeriodReviewLauncher() {
  const { data: quarter } = useRitualsQuarter()
  const { data: year } = useRitualsYear()
  const [quarterOpen, setQuarterOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold">Periodic reviews</h3>
        <p className="text-xs text-muted-foreground">
          Long-horizon rituals close the vision loop. Auto-opens near the period end; trigger manually any time.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => setQuarterOpen(true)}
          disabled={!quarter?.review}
          className="justify-start"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">Quarterly</div>
            <div className="text-[11px] text-muted-foreground">
              {quarter?.periodKey ?? '—'}
              {quarter?.review?.status === 'COMPLETED' && ' · done'}
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => setYearOpen(true)}
          disabled={!year?.review}
          className="justify-start"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <div className="text-left">
            <div className="text-sm font-medium">Annual</div>
            <div className="text-[11px] text-muted-foreground">
              {year?.periodKey ?? '—'}
              {year?.review?.status === 'COMPLETED' && ' · done'}
            </div>
          </div>
        </Button>
      </div>

      {quarter?.review && (
        <PeriodReviewDialog
          instance={quarter.review}
          open={quarterOpen}
          onClose={() => setQuarterOpen(false)}
          title="Quarterly Review"
          periodLabel={quarter.periodKey}
        />
      )}
      {year?.review && (
        <PeriodReviewDialog
          instance={year.review}
          open={yearOpen}
          onClose={() => setYearOpen(false)}
          title="Annual Review"
          periodLabel={year.periodKey}
        />
      )}
      </CardContent>
    </Card>
  )
}
