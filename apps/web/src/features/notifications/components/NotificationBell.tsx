import { useQuery } from '@tanstack/react-query'
import {
  notificationQueries,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../queries'
import type { InboxNotification } from '../api'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  Flame,
  Target,
  X,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

const typeIcon: Record<string, React.ReactNode> = {
  overdue_task: <Clock className="h-4 w-4 text-amber-500" />,
  habit_missed: <Calendar className="h-4 w-4 text-blue-500" />,
  pending_transaction: <AlertCircle className="h-4 w-4 text-violet-500" />,
  smart_reminder: <Flame className="h-4 w-4 text-red-500" />,
  system: <Target className="h-4 w-4 text-muted-foreground" />,
}

const urgencyBar: Record<string, string> = {
  high: 'before:bg-red-500',
  medium: 'before:bg-amber-500',
  low: 'before:bg-muted-foreground/30',
}

function relativeTime(iso: string, locale: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff < 60) return rtf.format(-Math.round(diff), 'second')
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute')
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
  return rtf.format(-Math.round(diff / 86400), 'day')
}

export function NotificationBell() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(notificationQueries.inbox({ includeRead: true }))
  const markRead = useMarkNotificationRead()
  const dismiss = useDismissNotification()
  const markAllRead = useMarkAllNotificationsRead()

  const items = data?.data ?? []
  const unread = data?.unread ?? 0
  const showBadge = unread > 0
  const badgeText = unread > 99 ? '99+' : String(unread)

  function handleOpen(n: InboxNotification) {
    if (!n.readAt) markRead.mutate(n.id)
    if (n.href) navigate({ to: n.href })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notifications', { defaultValue: 'Notifications' })}
        >
          <Bell className="h-5 w-5" />
          {showBadge && (
            <Badge
              variant="destructive"
              className="absolute top-0.5 right-0.5 h-5 min-w-5 px-1 rounded-full text-[10px] font-semibold"
            >
              {badgeText}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(96vw,380px)] p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {t('notifications', { defaultValue: 'Notifications' })}
            </h3>
            {unread > 0 && (
              <Badge variant="destructive" className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {unread}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={unread === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              title={t('markAllRead', { defaultValue: 'Mark all read' })}
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t('loading', { defaultValue: 'Loading...' })}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t('no_notifications')}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.slice(0, 20).map((n) => {
                const urgency = n.urgency ?? 'low'
                const unreadRow = !n.readAt
                return (
                  <li
                    key={n.id}
                    className={`group relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 ${urgencyBar[urgency] ?? ''} ${unreadRow ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2 px-3 py-2.5">
                      <Button
                        variant="ghost"
                        onClick={() => handleOpen(n)}
                        className="flex-1 h-auto py-0 px-0 flex items-start gap-2 text-left min-w-0 justify-start whitespace-normal hover:bg-transparent"
                      >
                        <span className="mt-0.5 flex-shrink-0">{typeIcon[n.type] ?? typeIcon.system}</span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className={`text-sm truncate ${unreadRow ? 'font-semibold' : 'font-medium'}`}>
                              {n.title}
                            </span>
                            {n.href && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                          </span>
                          <span className="block text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.message}
                          </span>
                          <span className="block text-[10px] text-muted-foreground/70 mt-1">
                            {relativeTime(n.createdAt, i18n.language)}
                          </span>
                        </span>
                      </Button>
                      <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {unreadRow && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => markRead.mutate(n.id)}
                            title={t('markRead', { defaultValue: 'Mark read' })}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => dismiss.mutate(n.id)}
                          title={t('dismiss', { defaultValue: 'Dismiss' })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="px-3 py-2 border-t bg-muted/30">
          <Link
            to="/notifications"
            className="block text-center text-xs font-medium text-primary hover:underline"
          >
            {t('viewAllNotifications', { defaultValue: 'View all notifications' })}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
