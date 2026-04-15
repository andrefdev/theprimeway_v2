import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationQueries } from '../queries'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  Flame,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronRight,
  ListTodo,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { BatchedNotification } from '@repo/shared/types'

const BatchTypeIcon: Record<BatchedNotification['type'], React.ReactNode> = {
  batch_tasks: <Clock className="h-4 w-4" />,
  batch_habits: <Calendar className="h-4 w-4" />,
  batch_transactions: <AlertCircle className="h-4 w-4" />,
  smart_reminder: <Flame className="h-4 w-4" />,
}

const urgencyStyles: Record<string, string> = {
  high: 'border-l-2 border-l-red-500 bg-red-50 dark:bg-red-950/20',
  medium: 'border-l-2 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  low: '',
}

const UrgencyIcon: Record<string, React.ReactNode> = {
  high: <Flame className="h-4 w-4 text-red-500" />,
  medium: <Target className="h-4 w-4 text-amber-500" />,
  low: <ListTodo className="h-4 w-4 text-muted-foreground" />,
}

export function NotificationBell() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { data: batchedData } = useQuery(notificationQueries.batched())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const batched = batchedData?.data?.batched ?? []
  const totalCount = batchedData?.data?.totalCount ?? 0
  const count = Math.min(totalCount, 99)
  const showBadge = count > 0

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleItemClick = (href: string) => {
    navigate({ to: href })
  }

  const getBatchLabel = (batch: BatchedNotification): string => {
    switch (batch.type) {
      case 'batch_tasks':
        return batch.count === 1 ? batch.title : t('overdueTasksBatch', { count: batch.count })
      case 'batch_habits':
        return batch.count === 1 ? batch.title : t('habitsToComplete', { count: batch.count })
      case 'batch_transactions':
        return t('pendingTransactions', { count: batch.count })
      case 'smart_reminder':
        return batch.title
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5" />
          {showBadge && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
              {count === 99 ? '99+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <ScrollArea className="max-h-96">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-50" />
              <p className="text-sm">{t('no_notifications')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {batched.map((batch, idx) => {
                const key = `${batch.type}_${idx}`
                const isExpanded = expandedGroups.has(key)
                const isGroup = batch.count > 1 && batch.type !== 'smart_reminder'
                const urgency = batch.urgency ?? 'low'

                return (
                  <div key={key}>
                    {/* Batch header / single item */}
                    <button
                      onClick={() => {
                        if (isGroup) {
                          toggleGroup(key)
                        } else {
                          handleItemClick(batch.items[0]?.href ?? '/')
                        }
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-muted/80 transition-colors flex gap-3 ${urgencyStyles[urgency] ?? ''}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {batch.type === 'smart_reminder'
                          ? (UrgencyIcon[urgency] ?? BatchTypeIcon[batch.type])
                          : BatchTypeIcon[batch.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {getBatchLabel(batch)}
                          </p>
                          {batch.type === 'smart_reminder' && urgency === 'high' && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400 whitespace-nowrap">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {t('streakAtRisk')}
                            </span>
                          )}
                          {isGroup && batch.urgency === 'high' && (
                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                              {t('high')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {batch.message}
                        </p>
                      </div>
                      {isGroup && (
                        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded items */}
                    {isGroup && isExpanded && (
                      <div className="bg-muted/30">
                        {batch.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.href)}
                            className="w-full pl-11 pr-4 py-2 text-left hover:bg-muted transition-colors"
                          >
                            <p className="text-sm text-foreground truncate">{item.title}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
