import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export function CalendarNav() {
  const { t } = useTranslation('calendar')
  const { location } = useRouterState()

  const tabs = [
    { to: '/calendar', label: t('viewDay', { defaultValue: 'Day' }) },
    { to: '/calendar/month', label: t('viewMonth') },
  ]

  return (
    <div className="mx-auto w-full px-6 pt-2">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
