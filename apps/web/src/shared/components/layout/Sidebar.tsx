import { Link, useRouterState } from '@tanstack/react-router'
import logoSvg from '@/shared/assets/logo_full.svg'
import { useTranslation } from 'react-i18next'
import { sidebarIcons } from '@/shared/components/ui/minimal-icon'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@/shared/components/ui/sidebar'
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

function useMainNavItems() {
  const { t } = useTranslation('common')
  return [
    {
      title: t('navDashboard'),
      to: '/dashboard',
      icon: sidebarIcons.dashboard(undefined, { size: 20 }),
    },
    {
      title: t('navToday'),
      to: '/tasks/today',
      icon: sidebarIcons.today(undefined, { size: 20 }),
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
      title: t('navGoals'),
      to: '/goals',
      icon: sidebarIcons.goals(undefined, { size: 20 }),
    },
    {
      title: t('navAI'),
      to: '/ai',
      icon: sidebarIcons.chat(undefined, { size: 20 }),
    },
  ] satisfies NavItem[]
}

function useRoutinesNavItems() {
  const { t } = useTranslation('common')
  return [
    {
      title: t('navHabits'),
      to: '/habits',
      icon: sidebarIcons.habits(undefined, { size: 20 }),
    },
    {
      title: t('navRituals'),
      to: '/rituals',
      icon: sidebarIcons.rituals(undefined, { size: 20 }),
    },
  ] satisfies NavItem[]
}

function useModulesNavItems() {
  const { t } = useTranslation('common')
  const { features } = useFeatures()

  const items: NavItem[] = [
    {
      title: t('navBrain', { defaultValue: 'Brain' }),
      to: '/brain',
      icon: sidebarIcons.brain(undefined, { size: 20 }),
      requiredFeature: FEATURES.BRAIN_MODULE,
    },
  ]

  return items.filter((item) => {
    if (!item.requiredFeature) return true
    return features?.[item.requiredFeature]?.enabled ?? false
  })
}

function useFooterNavItems(): NavItem[] {
  return []
}

export function AppSidebar() {
  const { t } = useTranslation('common')
  const location = useRouterState({ select: (s) => s.location })
  const { toggleSidebar } = useSidebar()
  const mainItems = useMainNavItems()
  const routinesItems = useRoutinesNavItems()
  const modulesItems = useModulesNavItems()
  const footerItems = useFooterNavItems()

  function isActive(to: string) {
    if (to === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    const section = '/' + to.split('/')[1]
    return location.pathname.startsWith(section + '/') || location.pathname === section
  }

  return (
    <ShadcnSidebar collapsible="offcanvas" variant="inset" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            <SidebarMenuButton size="lg" asChild>
              <Link to={'/dashboard' as const}>
                <img src={logoSvg} alt="ThePrimeWay" className="h-8 w-8 shrink-0 rounded-md" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    ThePrimeWay
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{t('navRoutines')}</SidebarGroupLabel>
          <SidebarMenu>
            {routinesItems.map((item) => (
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

        {modulesItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('navModules')}</SidebarGroupLabel>
            <SidebarMenu>
              {modulesItems.map((item) => (
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton size="sm" asChild isActive={isActive(item.to)}>
                <Link to={item.to as '/'}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <a href="https://theprimeway.com/help" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="size-4" />
                <span>{t('navHelp')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  )
}
