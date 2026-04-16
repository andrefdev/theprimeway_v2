import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { gamificationQueries } from '../queries'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { EmptyState } from '@/shared/components/ui/empty-state'
import {
  Flame,
  CheckSquare,
  Repeat,
  Timer,
  Trophy,
  Shield,
  ChevronDown,
  Lock,
  Check,
  HelpCircle,
} from 'lucide-react'

interface CategoryAchievement {
  id: string
  key: string
  title: string
  description: string
  icon: string | null
  category: string
  rarity: string
  xpReward: number
  isUnlocked: boolean
  unlockedAt: string | null
}

interface AchievementCategory {
  category: string
  total: number
  unlocked: number
  xpEarned: number
  xpTotal: number
  achievements: CategoryAchievement[]
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  streaks: Flame,
  tasks: CheckSquare,
  habits: Repeat,
  pomodoro: Timer,
  milestones: Trophy,
  ranks: Shield,
}

const CATEGORY_I18N_KEYS: Record<string, string> = {
  streaks: 'categoryStreaks',
  tasks: 'categoryTasks',
  habits: 'categoryHabits',
  pomodoro: 'categoryPomodoro',
  milestones: 'categoryMilestones',
  ranks: 'categoryRanks',
  other: 'categoryOther',
}

const RARITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-500' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-500' },
  legendary: { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-500' },
}

const CATEGORY_ORDER = ['streaks', 'tasks', 'habits', 'pomodoro', 'milestones', 'ranks', 'other']

export function AchievementTree() {
  const { t, i18n } = useTranslation('gamification')
  const locale = i18n.language
  const categoriesQuery = useQuery(gamificationQueries.achievementsByCategory(locale))
  const categories = (categoriesQuery.data?.data ?? []) as AchievementCategory[]

  // Sort categories by defined order
  const sortedCategories = [...categories].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.category)
    const bIdx = CATEGORY_ORDER.indexOf(b.category)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  const totalUnlocked = categories.reduce((sum, c) => sum + c.unlocked, 0)
  const totalAchievements = categories.reduce((sum, c) => sum + c.total, 0)

  if (categoriesQuery.isLoading) return <SkeletonList lines={4} />

  if (categories.length === 0) {
    return <EmptyState title={t('noAchievements')} description={t('noAchievementsDescription')} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('achievementTrees')}</h3>
        <Badge variant="secondary" className="text-xs">
          {totalUnlocked}/{totalAchievements}
        </Badge>
      </div>

      {sortedCategories.map((category) => (
        <CategoryCard key={category.category} category={category} t={t} />
      ))}
    </div>
  )
}

function CategoryCard({
  category,
  t,
}: {
  category: AchievementCategory
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const [isOpen, setIsOpen] = useState(category.unlocked > 0)
  const Icon = CATEGORY_ICONS[category.category] || HelpCircle
  const i18nKey = CATEGORY_I18N_KEYS[category.category] || 'categoryOther'
  const progressPct = category.total > 0 ? (category.unlocked / category.total) * 100 : 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t(i18nKey)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('unlockedOf', { unlocked: category.unlocked, total: category.total })}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progressPct} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {t('xpEarned', { earned: category.xpEarned, total: category.xpTotal })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0">
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {category.achievements.map((ach) => (
                  <AchievementBadge key={ach.id} achievement={ach} />
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function AchievementBadge({ achievement }: { achievement: CategoryAchievement }) {
  const rarity = (RARITY_COLORS[achievement.rarity] ?? RARITY_COLORS.common)!
  const isUnlocked = achievement.isUnlocked

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            relative flex h-12 w-12 items-center justify-center rounded-full border-2
            transition-all
            ${isUnlocked
              ? `${rarity.border} ${rarity.bg}`
              : 'border-muted bg-muted/30 opacity-50 grayscale'
            }
          `}
        >
          <span className="text-lg">{achievement.icon || '🏆'}</span>

          {isUnlocked && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
              <Check className="h-2.5 w-2.5 text-white" />
            </div>
          )}

          {!isUnlocked && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/50">
              <Lock className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-48">
        <div className="space-y-1">
          <p className="text-xs font-medium">{achievement.title}</p>
          <p className="text-[10px] text-muted-foreground">{achievement.description}</p>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[9px] capitalize ${rarity.text}`}
            >
              {achievement.rarity}
            </Badge>
            <span className="text-[9px] text-muted-foreground">+{achievement.xpReward} XP</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
