import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { sidebarIcons } from '@/shared/components/ui/minimal-icon'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { MoreHorizontal } from 'lucide-react'

export function MobileBottomNav() {
  const { t } = useTranslation('common')
  const location = useRouterState({ select: (s) => s.location })
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const mainItems = [
    {
      href: '/dashboard',
      icon: sidebarIcons.dashboard('h-5 w-5', {}),
      label: t('navDashboard'),
    },
    {
      href: '/tasks/today',
      icon: sidebarIcons.today('h-5 w-5', {}),
      label: t('navToday'),
    },
    {
      href: '/calendar',
      icon: sidebarIcons.weekPlanning('h-5 w-5', {}),
      label: t('navCalendar'),
    },
    {
      href: '/goals',
      icon: sidebarIcons.goals('h-5 w-5', {}),
      label: t('navGoals'),
    },
  ]

  const moreItems = [
    {
      href: '/ai',
      icon: sidebarIcons.chat('h-5 w-5', {}),
      label: t('navAI'),
    },
    {
      href: '/habits',
      icon: sidebarIcons.habits('h-5 w-5', {}),
      label: t('navHabits'),
    },
    {
      href: '/rituals',
      icon: sidebarIcons.rituals('h-5 w-5', {}),
      label: t('navRituals'),
    },
    {
      href: '/pomodoro',
      icon: sidebarIcons.pomodoro('h-5 w-5', {}),
      label: t('navPomodoro'),
    },
    {
      href: '/settings',
      icon: sidebarIcons.settings('h-5 w-5', {}),
      label: t('navSettings'),
    },
  ]

  const isMoreActive = moreItems.some((item) => isActive(item.href))

  return (
    <>
      <div className="border-t bg-background pb-safe md:hidden">
        <nav className="grid grid-cols-5 gap-1 p-2">
          {mainItems.map((item) => (
            <Link
              key={item.href}
              to={item.href as '/'}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors',
                isActive(item.href)
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors',
              isMoreActive
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px]">{t('more')}</span>
          </button>
        </nav>
      </div>

      {/* More menu sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('more')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                to={item.href as '/'}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl p-3 transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
