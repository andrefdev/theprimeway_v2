import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  notificationQueries,
  useDeleteNotification,
  useDismissAllNotifications,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notifications/queries'
import type { InboxNotification } from '@/features/notifications/api'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import {
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  Flame,
  Target,
  Check,
  CheckCheck,
  Trash2,
  X,
  Archive,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
})

const typeIcon: Record<string, React.ReactNode> = {
  overdue_task: <Clock className="h-4 w-4 text-amber-500" />,
  habit_missed: <Calendar className="h-4 w-4 text-blue-500" />,
  pending_transaction: <AlertCircle className="h-4 w-4 text-violet-500" />,
  smart_reminder: <Flame className="h-4 w-4 text-red-500" />,
  system: <Target className="h-4 w-4 text-muted-foreground" />,
}

type Filter = 'active' | 'unread' | 'all'

function NotificationsPage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('active')

  const opts =
    filter === 'all'
      ? { includeRead: true, includeDismissed: true }
      : filter === 'unread'
        ? { includeRead: false, includeDismissed: false }
        : { includeRead: true, includeDismissed: false }

  const { data, isLoading } = useQuery(notificationQueries.inbox(opts))

  const markRead = useMarkNotificationRead()
  const dismiss = useDismissNotification()
  const remove = useDeleteNotification()
  const markAllRead = useMarkAllNotificationsRead()
  const dismissAll = useDismissAllNotifications()

  const items = data?.data ?? []
  const unread = data?.unread ?? 0

  function open(n: InboxNotification) {
    if (!n.readAt) markRead.mutate(n.id)
    if (n.href) navigate({ to: n.href })
  }

  function rel(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    if (diff < 60) return rtf.format(-Math.round(diff), 'second')
    if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute')
    if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
    return rtf.format(-Math.round(diff / 86400), 'day')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications', { defaultValue: 'Notifications' })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread > 0
              ? t('unreadCount', { defaultValue: '{{count}} unread', count: unread })
              : t('allCaughtUp', { defaultValue: "You're all caught up" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            {t('markAllRead', { defaultValue: 'Mark all read' })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={items.length === 0 || dismissAll.isPending}
            onClick={() => dismissAll.mutate()}
          >
            <Archive className="h-3.5 w-3.5 mr-1.5" />
            {t('dismissAll', { defaultValue: 'Dismiss all' })}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b">
        {(['active', 'unread', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === f
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`notifTab_${f}`, { defaultValue: f.charAt(0).toUpperCase() + f.slice(1) })}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('loading', { defaultValue: 'Loading...' })}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 opacity-40" />
              <p className="text-sm">{t('no_notifications')}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const unreadRow = !n.readAt
                const dismissed = !!n.dismissedAt
                return (
                  <li
                    key={n.id}
                    className={`group relative flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors ${
                      unreadRow && !dismissed ? 'bg-primary/5' : ''
                    } ${dismissed ? 'opacity-60' : ''}`}
                  >
                    <span className="mt-0.5 flex-shrink-0">{typeIcon[n.type] ?? typeIcon.system}</span>
                    <button
                      onClick={() => open(n)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${unreadRow ? 'font-semibold' : 'font-medium'}`}>
                          {n.title}
                        </span>
                        {n.urgency === 'high' && (
                          <span className="text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 rounded-full px-1.5 py-0.5">
                            {t('high', { defaultValue: 'High' })}
                          </span>
                        )}
                        {n.href && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{rel(n.createdAt)}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {unreadRow && !dismissed && (
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => markRead.mutate(n.id)}
                          title={t('markRead', { defaultValue: 'Mark read' })}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {!dismissed && (
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => dismiss.mutate(n.id)}
                          title={t('dismiss', { defaultValue: 'Dismiss' })}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate(n.id)}
                        title={t('delete', { defaultValue: 'Delete' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
