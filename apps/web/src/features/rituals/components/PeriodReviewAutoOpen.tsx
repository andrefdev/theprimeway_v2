import { useEffect, useState } from 'react'
import { useRitualsQuarter, useRitualsYear } from '../queries'
import { PeriodReviewDialog } from './PeriodReviewDialog'
import { periodReviewUnlocked } from '../lib/period-review-unlock'

/**
 * Mounts on the Vision surface. Auto-opens the Quarterly review during
 * the last 7 days of a quarter, and the Annual review during the last
 * 14 days of a year, but only when the corresponding instance is still PENDING.
 */
export function PeriodReviewAutoOpen() {
  const { data: quarter } = useRitualsQuarter()
  const { data: year } = useRitualsYear()

  const [quarterOpen, setQuarterOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const [dismissedKey, setDismissedKey] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!quarter?.review || quarter.review.status !== 'PENDING') return
    if (dismissedKey.has(`q:${quarter.periodKey}`)) return
    if (periodReviewUnlocked('QUARTERLY_REVIEW', quarter.review.scheduledFor)) {
      setQuarterOpen(true)
    }
  }, [quarter, dismissedKey])

  useEffect(() => {
    if (!year?.review || year.review.status !== 'PENDING') return
    if (dismissedKey.has(`y:${year.periodKey}`)) return
    if (periodReviewUnlocked('ANNUAL_REVIEW', year.review.scheduledFor)) {
      setYearOpen(true)
    }
  }, [year, dismissedKey])

  return (
    <>
      {quarter?.review && (
        <PeriodReviewDialog
          instance={quarter.review}
          open={quarterOpen}
          onClose={() => {
            setQuarterOpen(false)
            setDismissedKey((s) => new Set([...s, `q:${quarter.periodKey}`]))
          }}
          title="Quarterly Review"
          periodLabel={quarter.periodKey}
          unlocked
        />
      )}
      {year?.review && (
        <PeriodReviewDialog
          instance={year.review}
          open={yearOpen}
          onClose={() => {
            setYearOpen(false)
            setDismissedKey((s) => new Set([...s, `y:${year.periodKey}`]))
          }}
          title="Annual Review"
          periodLabel={year.periodKey}
          unlocked
        />
      )}
    </>
  )
}
