import { Link, useRouterState } from '@tanstack/react-router'
import logoSvg from '@/assets/logo.svg'
import { useTranslation } from 'react-i18next'
import { sidebarIcons } from '@/components/ui/minimal-icon'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { PanelLeftClose, HelpCircle } from 'lucide-react'
import { useFeatures } from '@/features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'
import type { FeatureKey } from '@repo/shared/constants'

interface NavItem {
  title: string
  to: string
  icon: React.ReactNode
  requiredFeature?: FeatureKey
}

function useNavItems() {
  const { t } = useTranslation('common')

  const navItems: NavItem[] = [
    {
      title: t('navDashboard'),
      to: '/dashboard',
      icon: sidebarIcons.dashboard(undefined, { size: 20 }),
    },
    {
      title: t('navTasks'),
      to: '/tasks/today',
      icon: sidebarIcons.tasks(undefined, { size: 20 }),
    },
    {
      title: t('navHabits'),
      to: '/habits',
      icon: sidebarIcons.habits(undefined, { size: 20 }),
    },
    {
      title: t('navGoals'),
      to: '/goals',
      icon: sidebarIcons.goals(undefined, { size: 20 }),
    },
    {
      title: t('navFinances'),
      to: '/finances',
      icon: sidebarIcons.finances(undefined, { size: 20 }),
      requiredFeature: FEATURES.FINANCES_MODULE,
    },
    {
      title: t('navNotes'),
      to: '/notes',
      icon: sidebarIcons.notes(undefined, { size: 20 }),
      requiredFeature: FEATURES.NOTES_MODULE,
    },
    {
      title: t('navReading'),
      to: '/reading',
      icon: sidebarIcons.reading(undefined, { size: 20 }),
      requiredFeature: FEATURES.READING_MODULE,
    },
    {
      title: t('navPomodoro'),
      to: '/pomodoro',
      icon: sidebarIcons.pomodoro(undefined, { size: 20 }),
    },
    {
      title: t('navCalendar'),
      to: '/calendar',
      icon: sidebarIcons.weekPlanning(undefined, { size: 20 }),
    },
    {
      title: t('navAI'),
      to: '/ai',
      icon: sidebarIcons.alebot(undefined, { size: 20 }),
      requiredFeature: FEATURES.AI_ASSISTANT,
    },
  ]

  return navItems
}

function useVisibleNavItems() {
  const navItems = useNavItems()
  const { features } = useFeatures()

  return navItems.filter((item) => {
    if (!item.requiredFeature) return true
    return features?.[item.requiredFeature]?.enabled ?? false
  })
}

export function AppSidebar() {
  const { t } = useTranslation('common')
  const location = useRouterState({ select: (s) => s.location })
  const { toggleSidebar } = useSidebar()
  const navItems = useVisibleNavItems()

  function isActive(to: string) {
    if (to === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    // Match section root (e.g. /tasks/today highlights for any /tasks/* route)
    const section = '/' + to.split('/')[1]
    return location.pathname.startsWith(section + '/') || location.pathname === section
  }

  return (
    <ShadcnSidebar collapsible="offcanvas" variant="inset" className="border-r-0">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            <SidebarMenuButton size="lg" asChild>
              <Link to={'/dashboard' as const}>
                <img src={logoSvg} alt="ThePrimeWay" className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    ThePrimeWay
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
            {/* Collapse button — visible on sidebar hover */}
            <button
              onClick={toggleSidebar}
              className="absolute right-2 top-3 z-50 flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover/sidebar:opacity-100"
              title={t('collapse')}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to as '/'}>
                    {item.icon}
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a href="https://theprimeway.com/help" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="size-4" />
                <span>{t('help')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  )
}
