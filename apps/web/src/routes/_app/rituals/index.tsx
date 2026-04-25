import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useRitualsToday, useRitualsWeek, useRitualsQuarter, useRitualsYear } from '@/features/rituals/queries'
import type { RitualKind } from '@/features/rituals/api'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { RitualsNav } from '@/features/rituals/components/RitualsNav'

export const Route = createFileRoute('/_app/rituals/')({
  component: RitualsIndexPage,
})

interface RitualCard {
  kind: RitualKind
  slug: string
  title: string
  description: string
}

const KIND_TO_SLUG: Record<RitualKind, string> = {
  DAILY_PLAN: 'daily-plan',
  DAILY_SHUTDOWN: 'daily-shutdown',
  WEEKLY_PLAN: 'weekly-plan',
  WEEKLY_REVIEW: 'weekly-review',
  QUARTERLY_REVIEW: 'quarterly-review',
  ANNUAL_REVIEW: 'annual-review',
  CUSTOM: 'custom',
}

function RitualsIndexPage() {
  const { t } = useTranslation('common')
  const today = useRitualsToday()
  const week = useRitualsWeek()
  const quarter = useRitualsQuarter()
  const year = useRitualsYear()

  const cards: RitualCard[] = [
    {
      kind: 'DAILY_PLAN',
      slug: 'daily-plan',
      title: 'Daily Plan',
      description: 'Plan your day before you start.',
    },
    {
      kind: 'DAILY_SHUTDOWN',
      slug: 'daily-shutdown',
      title: 'Daily Shutdown',
      description: 'Close out the day, capture wins and tomorrow.',
    },
    {
      kind: 'WEEKLY_PLAN',
      slug: 'weekly-plan',
      title: 'Weekly Plan',
      description: 'Set objectives for the week ahead.',
    },
    {
      kind: 'WEEKLY_REVIEW',
      slug: 'weekly-review',
      title: 'Weekly Review',
      description: 'Reflect on the week, learn, and reset.',
    },
    {
      kind: 'QUARTERLY_REVIEW',
      slug: 'quarterly-review',
      title: 'Quarterly Review',
      description: 'Long-horizon check on goals and direction.',
    },
    {
      kind: 'ANNUAL_REVIEW',
      slug: 'annual-review',
      title: 'Annual Review',
      description: 'Year in review and intentions for next.',
    },
  ]

  function statusFor(kind: RitualKind): { label: string; tone: 'default' | 'secondary' | 'outline' } | null {
    if (kind === 'DAILY_PLAN') {
      const inst = today.data?.plan
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? 'Done today' : 'Pending today', tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    if (kind === 'DAILY_SHUTDOWN') {
      const inst = today.data?.shutdown
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? 'Done today' : 'Pending today', tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    if (kind === 'WEEKLY_PLAN') {
      const inst = week.data?.plan
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? 'Done this week' : 'Pending this week', tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    if (kind === 'WEEKLY_REVIEW') {
      const inst = week.data?.review
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? 'Done this week' : 'Pending this week', tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    if (kind === 'QUARTERLY_REVIEW') {
      const inst = quarter.data?.review
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? `${quarter.data?.periodKey} done` : `${quarter.data?.periodKey} pending`, tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    if (kind === 'ANNUAL_REVIEW') {
      const inst = year.data?.review
      if (!inst) return null
      return { label: inst.status === 'COMPLETED' ? `${year.data?.periodKey} done` : `${year.data?.periodKey} pending`, tone: inst.status === 'COMPLETED' ? 'secondary' : 'default' }
    }
    return null
  }

  return (
    <div>
      <RitualsNav />
      <SectionHeader
        sectionId="rituals"
        title={t('navRituals')}
        description="Recurring reflection and planning surfaces. Each ritual has its own page with history and AI summary."
      />
      <div className="mx-auto max-w-5xl px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const status = statusFor(card.kind)
          return (
            <Link key={card.slug} to={'/rituals/$kind' as '/'} params={{ kind: card.slug }}>
              <Card className="relative h-full bg-muted/40 transition-colors hover:border-primary/40 hover:bg-muted/60">
                {status && (
                  <Badge
                    variant={status.tone}
                    className="absolute right-2.5 top-2.5 px-2 py-0.5 text-[11px] leading-none h-5"
                  >
                    {status.label}
                  </Badge>
                )}
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-base font-semibold pr-20">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        </div>
      </div>
    </div>
  )
}

export { KIND_TO_SLUG }
