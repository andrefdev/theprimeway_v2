import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import logoSvg from '@/shared/assets/logo.svg'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/auth.store'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { Button } from '@/shared/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/shared/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { PanelLeftOpen, LogOut, Settings, User } from 'lucide-react'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { PomodoroMiniTimer } from '@/shared/components/PomodoroMiniTimer'
import { ActiveTaskHeaderBadge } from '@/features/tasks/components/ActiveTaskHeaderBadge'

// Route segment to i18n key mapping
const ROUTE_LABELS: Record<string, string> = {
  '': 'navDashboard',
  'tasks': 'navTasks',
  'today': 'today',
  'weekly': 'weekly',
  'all': 'all',
  'habits': 'navHabits',
  'goals': 'navGoals',
  'recurring': 'recurring',
  'notes': 'navNotes',
  'trash': 'trash',
  'reading': 'navReading',
  'library': 'library',
  'pomodoro': 'navPomodoro',
  'calendar': 'navCalendar',
  'settings': 'navSettings',
  'profile': 'navProfile',
  'dashboard': 'navDashboard',
  'ai': 'navAI',
}

interface BreadcrumbSegment {
  label: string
  href: string
}

function buildBreadcrumbs(pathname: string, t: (key: string) => string): BreadcrumbSegment[] {
  const clean = pathname.replace(/\/$/, '') || '/'

  if (clean === '/') {
    return [{ label: t('navDashboard'), href: '/' }]
  }

  const parts = clean.split('/').filter(Boolean)
  const segments: BreadcrumbSegment[] = []

  let currentPath = ''
  for (const part of parts) {
    currentPath += `/${part}`
    const key = ROUTE_LABELS[part]
    const label = key ? t(key) : part.charAt(0).toUpperCase() + part.slice(1)
    segments.push({ label, href: currentPath })
  }

  return segments
}

export function Header() {
  const { t } = useTranslation('common')
  const location = useRouterState({ select: (s) => s.location })
  const { state, toggleSidebar } = useSidebar()
  const isMobile = useIsMobile()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const segments = buildBreadcrumbs(location.pathname, t)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 bg-background px-4 md:px-6">
      {/* Mobile: Logo + app name */}
      {isMobile && (
        <>
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="ThePrimeWay" className="h-7 w-7 shrink-0 rounded-lg" />
            <span className="text-base font-semibold">ThePrimeWay</span>
          </div>
        </>
      )}

      {/* Desktop: Breadcrumbs */}
      {!isMobile && (
        <div className="flex flex-1 items-center">
          {/* Expand button — only visible when sidebar is collapsed */}
          {state === 'collapsed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="-ml-2 mr-2 h-7 w-7"
              title={t('expand')}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}

          <Breadcrumb>
            <BreadcrumbList>
              {segments.map((segment, idx) => (
                <React.Fragment key={segment.href}>
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {idx === segments.length - 1 ? (
                      <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={segment.href}>{segment.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Right side: user profile */}
      <div className="ml-auto flex items-center gap-1">
        {/* Active task timer */}
        <ActiveTaskHeaderBadge />
        {/* Pomodoro mini-timer */}
        <PomodoroMiniTimer />
        {/* Notification bell */}
        <NotificationBell />

        {/* User avatar dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                {!isMobile && (
                  <span className="max-w-[120px] truncate text-sm">
                    {user.name || user.email}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={'/profile' as const}>
                  <User className="mr-2 h-4 w-4" />
                  {t('navProfile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={'/settings' as const}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navSettings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('navLogout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
