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
import { PanelLeftClose, HelpCircle, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible'
import { useFeatures } from '@/features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'
import type { FeatureKey } from '@repo/shared/constants'

interface NavItem {
  title: string
  to: string
  icon: React.ReactNode
  requiredFeature?: FeatureKey
}

/** Primary surfaces per Vision-to-Execution OS UX spec §6.1: Today / Compass / Vision / Library. */
function useCoreNavItems() {
  const { t } = useTranslation('common')

  return [
    {
      title: t('navToday'),
      to: '/tasks/today',
      icon: sidebarIcons.tasks(undefined, { size: 20 }),
    },
    {
      title: t('navCompass'),
      to: '/compass',
      icon: sidebarIcons.weekPlanning(undefined, { size: 20 }),
    },
    {
      title: t('navVision'),
      to: '/goals',
      icon: sidebarIcons.goals(undefined, { size: 20 }),
    },
  ] satisfies NavItem[]
}

/** Library children — habits + channels (spec §6.1: Library owns habits, channels, archive, filters). */
function useLibraryNavItems() {
  const { t } = useTranslation('common')
  return [
    {
      title: t('navHabits'),
      to: '/habits',
      icon: sidebarIcons.habits(undefined, { size: 20 }),
    },
    {
      title: 'Channels',
      to: '/channels',
      icon: sidebarIcons.habits(undefined, { size: 20 }),
    },
    {
      title: 'Recurring',
      to: '/recurring',
      icon: sidebarIcons.habits(undefined, { size: 20 }),
    },
  ] satisfies NavItem[]
}

/** Tools (secondary): supporting surfaces that don't belong to the four primary. */
function useToolsNavItems() {
  const { t } = useTranslation('common')
  return [
    {
      title: t('navDashboard'),
      to: '/dashboard',
      icon: sidebarIcons.dashboard(undefined, { size: 20 }),
    },
    {
      title: t('navPomodoro'),
      to: '/pomodoro',
      icon: sidebarIcons.pomodoro(undefined, { size: 20 }),
    },
    {
      title: t('navAI'),
      to: '/ai',
      icon: sidebarIcons.chat(undefined, { size: 20 }),
    },
  ] satisfies NavItem[]
}

function useSecondaryNavItems() {
  const { t } = useTranslation('common')
  const { features } = useFeatures()

  const items: NavItem[] = [
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
  ]

  return items.filter((item) => {
    if (!item.requiredFeature) return true
    return features?.[item.requiredFeature]?.enabled ?? false
  })
}

export function AppSidebar() {
  const { t } = useTranslation('common')
  const location = useRouterState({ select: (s) => s.location })
  const { toggleSidebar } = useSidebar()
  const coreItems = useCoreNavItems()
  const libraryItems = useLibraryNavItems()
  const toolsItems = useToolsNavItems()
  const secondaryItems = useSecondaryNavItems()

  function isActive(to: string) {
    if (to === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
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

      {/* Navigation */}
      <SidebarContent>
        {/* Primary surfaces: Today / Compass / Vision */}
        <SidebarGroup>
          <SidebarMenu>
            {coreItems.map((item) => (
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

        {/* Library */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('navLibrary')}</SidebarGroupLabel>
          <SidebarMenu>
            {libraryItems.map((item) => (
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

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('navTools')}</SidebarGroupLabel>
          <SidebarMenu>
            {toolsItems.map((item) => (
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

        {/* Secondary modules — collapsible */}
        {secondaryItems.length > 0 && (
          <Collapsible defaultOpen={false} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer select-none">
                  {t('navMore')}
                  <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu>
                  {secondaryItems.map((item) => (
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
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
