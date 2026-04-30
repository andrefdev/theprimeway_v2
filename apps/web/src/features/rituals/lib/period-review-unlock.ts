export type PeriodReviewKind = 'QUARTERLY_REVIEW' | 'ANNUAL_REVIEW'

const WINDOW_DAYS: Record<PeriodReviewKind, number> = {
  QUARTERLY_REVIEW: 7,
  ANNUAL_REVIEW: 14,
}

export function periodReviewWindowMs(kind: PeriodReviewKind) {
  return WINDOW_DAYS[kind] * 24 * 60 * 60 * 1000
}

export function periodReviewUnlocked(
  kind: PeriodReviewKind,
  scheduledFor: string | Date,
  now: Date = new Date(),
) {
  const scheduled = new Date(scheduledFor).getTime()
  return scheduled - now.getTime() <= periodReviewWindowMs(kind)
}

export function periodReviewUnlockDate(
  kind: PeriodReviewKind,
  scheduledFor: string | Date,
) {
  return new Date(new Date(scheduledFor).getTime() - periodReviewWindowMs(kind))
}
