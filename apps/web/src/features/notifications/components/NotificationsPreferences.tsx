import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { notificationQueries } from '../queries'
import { notificationsApi } from '../api'
import { NotifToggle } from './NotifToggle'
import { disableWebPush, enableWebPush, isPushEnabledLocally } from '../push'
import { isFirebaseConfigured } from '@/lib/firebase'
import type { NotificationPreferences } from '@repo/shared/types'

export function NotificationsPreferences() {
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()
  const notifQuery = useQuery(notificationQueries.preferences())
  const notifPrefs = notifQuery.data?.data as NotificationPreferences | undefined
  const [, setSavingNotifs] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const firebaseReady = isFirebaseConfigured()
  const browserPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default'

  useEffect(() => {
    setPushEnabled(isPushEnabledLocally())
  }, [])

  async function handleTogglePush() {
    setPushBusy(true)
    try {
      if (pushEnabled) {
        await disableWebPush()
        setPushEnabled(false)
        toast.success(t('pushDisabled', { defaultValue: 'Push notifications disabled' }))
      } else {
        const res = await enableWebPush()
        if (res.ok) {
          setPushEnabled(true)
          toast.success(t('pushEnabled', { defaultValue: 'Push notifications enabled' }))
        } else {
          const msg =
            res.reason === 'permission_denied'
              ? t('pushPermissionDenied', { defaultValue: 'Permission denied' })
              : res.reason === 'not_configured'
                ? t('pushNotConfigured', { defaultValue: 'Push not configured' })
                : res.reason === 'unsupported'
                  ? t('pushUnsupported', { defaultValue: 'Browser does not support push' })
                  : t('failedToSave')
          toast.error(msg)
        }
      }
    } finally {
      setPushBusy(false)
    }
  }

  async function handleNotifToggle(key: keyof NotificationPreferences, value: boolean) {
    setSavingNotifs(true)
    try {
      await notificationsApi.updatePreferences({ [key]: value })
      queryClient.invalidateQueries({ queryKey: notificationQueries.all() })
      toast.success(t('settingsSaved'))
    } catch {
      toast.error(t('failedToSave'))
    } finally {
      setSavingNotifs(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('notifications')}</h3>

        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-2">
              {pushEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {t('pushNotifications', { defaultValue: 'Push notifications' })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!firebaseReady
                ? t('pushNotConfigured', { defaultValue: 'Push not configured' })
                : browserPermission === 'denied'
                  ? t('pushBlockedByBrowser', { defaultValue: 'Blocked by browser — enable in site settings' })
                  : t('pushDescription', { defaultValue: 'Receive alerts on this device even when the app is closed' })}
            </p>
          </div>
          <Button
            type="button"
            variant={pushEnabled ? 'outline' : 'default'}
            size="sm"
            disabled={pushBusy || !firebaseReady || browserPermission === 'denied'}
            onClick={handleTogglePush}
          >
            {pushEnabled
              ? t('disable', { defaultValue: 'Disable' })
              : t('enable', { defaultValue: 'Enable' })}
          </Button>
        </div>

        {notifQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <NotifToggle
              id="taskReminders"
              label={t('taskReminders')}
              description={t('taskDescription')}
              checked={notifPrefs?.taskReminders ?? true}
              onToggle={(v) => handleNotifToggle('taskReminders', v)}
            />
            <NotifToggle
              id="habitReminders"
              label={t('habitReminders')}
              description={t('habitDescription')}
              checked={notifPrefs?.habitReminders ?? true}
              onToggle={(v) => handleNotifToggle('habitReminders', v)}
            />
            <NotifToggle
              id="pomodoroAlerts"
              label={t('pomodoroAlerts')}
              description={t('pomodoroDescription')}
              checked={notifPrefs?.pomodoroAlerts ?? true}
              onToggle={(v) => handleNotifToggle('pomodoroAlerts', v)}
            />
            <NotifToggle
              id="dailyMotivation"
              label={t('dailyMotivation')}
              description={t('dailyMotivationDescription')}
              checked={notifPrefs?.dailyMotivation ?? false}
              onToggle={(v) => handleNotifToggle('dailyMotivation', v)}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
