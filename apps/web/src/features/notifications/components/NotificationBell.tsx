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
import {
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  Flame,
  Target,
  X,
  CheckCheck,
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
            <span
              aria-label={`${unread} unread`}
              className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm ring-2 ring-background"
            >
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(96vw,380px)] p-0 overflow-hidden rounded-xl shadow-lg"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">
            {t('notifications', { defaultValue: 'Notifications' })}
          </h3>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unread === 0 || markAllRead.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('markAllRead', { defaultValue: 'Mark all as read' })}
          </button>
        </div>

        <ScrollArea className="max-h-[min(70vh,440px)]">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t('loading', { defaultValue: 'Loading...' })}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t('no_notifications', { defaultValue: 'No notifications' })}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const unreadRow = !n.readAt
                return (
                  <li key={n.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      {unreadRow && (
                        <span
                          aria-hidden
                          className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-primary"
                        />
                      )}
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        {typeIcon[n.type] ?? typeIcon.system}
                      </span>
                      <span className="flex-1 min-w-0 pr-6">
                        <span
                          className={`block text-sm truncate ${unreadRow ? 'font-semibold' : 'font-medium'}`}
                        >
                          {n.title}
                        </span>
                        {n.message && (
                          <span className="block text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.message}
                          </span>
                        )}
                        <span className="block text-[11px] text-muted-foreground/80 mt-1">
                          {relativeTime(n.createdAt, i18n.language)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismiss.mutate(n.id)
                      }}
                      title={t('dismiss', { defaultValue: 'Dismiss' })}
                      aria-label={t('dismiss', { defaultValue: 'Dismiss' })}
                      className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Link
            to="/notifications"
            className="mx-auto block w-fit rounded-full border px-4 py-1.5 text-xs font-medium hover:bg-muted"
          >
            {t('showAll', { defaultValue: 'Show all' })}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
