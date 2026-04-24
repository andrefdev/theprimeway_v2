import { Icon } from '@iconify/react'
import { cn } from '@/shared/lib/utils'

export interface MinimalIconProps {
  name: string
  size?: number
  weight?: string
  className?: string
}

const DEFAULT_ICON_SIZE = 20

export function MinimalIcon({
  name,
  size = DEFAULT_ICON_SIZE,
  className,
}: MinimalIconProps) {
  return (
    <Icon
      icon={name}
      width={size}
      height={size}
      className={cn('text-foreground', className)}
    />
  )
}

type IconFactory = (
  cls?: string,
  opts?: { size?: number; weight?: MinimalIconProps['weight'] },
) => React.ReactElement

export const sidebarIcons = {
  dashboard: (cls, opts) => (
    <MinimalIcon name="ci:house-02" className={cls} size={opts?.size} />
  ),
  tasks: (cls, opts) => (
    <MinimalIcon name="ci:list-check" className={cls} size={opts?.size} />
  ),
  habits: (cls, opts) => (
    <MinimalIcon name="ci:check-all" className={cls} size={opts?.size} />
  ),
  goals: (cls, opts) => (
    <MinimalIcon name="ci:radio-fill" className={cls} size={opts?.size} />
  ),
  finances: (cls, opts) => (
    <MinimalIcon name="ci:credit-card-01" className={cls} size={opts?.size} />
  ),
  notes: (cls, opts) => (
    <MinimalIcon name="ci:note" className={cls} size={opts?.size} />
  ),
  brain: (cls, opts) => (
    <MinimalIcon name="ci:lightning-02" className={cls} size={opts?.size} />
  ),
  financesOverview: (cls, opts) => (
    <MinimalIcon
      name="ci:chart-bar-vertical-01"
      className={cls}
      size={opts?.size}
    />
  ),
  financesTransactions: (cls, opts) => (
    <MinimalIcon name="ci:transfer" className={cls} size={opts?.size} />
  ),
  financesAccounts: (cls, opts) => (
    <MinimalIcon name="ci:credit-card-01" className={cls} size={opts?.size} />
  ),
  financesBudgets: (cls, opts) => (
    <MinimalIcon name="ci:edit-pencil-01" className={cls} size={opts?.size} />
  ),
  financesDebts: (cls, opts) => (
    <MinimalIcon name="ci:credit-card" className={cls} size={opts?.size} />
  ),
  health: (cls, opts) => (
    <MinimalIcon name="ci:heart-fill" className={cls} size={opts?.size} />
  ),
  pomodoro: (cls, opts) => (
    <MinimalIcon name="ci:stopwatch" className={cls} size={opts?.size} />
  ),
  eisenhower: (cls, opts) => (
    <MinimalIcon name="ci:grid-big" className={cls} size={opts?.size} />
  ),
  chat: (cls, opts) => (
    <MinimalIcon name="ci:chat" className={cls} size={opts?.size} />
  ),
  reading: (cls, opts) => (
    <MinimalIcon name="ci:book-open" className={cls} size={opts?.size} />
  ),
  readingExplore: (cls, opts) => (
    <MinimalIcon name="ci:search" className={cls} size={opts?.size} />
  ),
  readingLibrary: (cls, opts) => (
    <MinimalIcon name="ci:layers" className={cls} size={opts?.size} />
  ),
  readingPlan: (cls, opts) => (
    <MinimalIcon name="ci:calendar" className={cls} size={opts?.size} />
  ),
  readingGoals: (cls, opts) => (
    <MinimalIcon name="ci:radio-fill" className={cls} size={opts?.size} />
  ),
  collapseOpen: (cls, opts) => (
    <MinimalIcon name="ci:menu-alt-01" className={cls} size={opts?.size} />
  ),
  collapseClosed: (cls, opts) => (
    <MinimalIcon name="ci:menu-alt-02" className={cls} size={opts?.size} />
  ),
  chevronDown: (cls, opts) => (
    <MinimalIcon name="ci:chevron-down" className={cls} size={opts?.size} />
  ),
  chevronRight: (cls, opts) => (
    <MinimalIcon name="ci:chevron-right" className={cls} size={opts?.size} />
  ),
  today: (cls, opts) => (
    <MinimalIcon name="ci:sun" className={cls} size={opts?.size} />
  ),
  weekPlanning: (cls, opts) => (
    <MinimalIcon name="ci:calendar" className={cls} size={opts?.size} />
  ),
  inbox: (cls, opts) => (
    <MinimalIcon name="ci:mail" className={cls} size={opts?.size} />
  ),
  allTasks: (cls, opts) => (
    <MinimalIcon name="ci:layers" className={cls} size={opts?.size} />
  ),
  focus: (cls, opts) => (
    <MinimalIcon name="ci:filter" className={cls} size={opts?.size} />
  ),
  gamification: (cls, opts) => (
    <MinimalIcon name="ci:trophy" className={cls} size={opts?.size} />
  ),
  alebot: (cls, opts) => (
    <MinimalIcon name="ci:user-circle" className={cls} size={opts?.size} />
  ),
} satisfies Record<string, IconFactory>
