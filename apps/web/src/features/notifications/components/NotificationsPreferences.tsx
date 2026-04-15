import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'
import { notificationQueries } from '../queries'
import { notificationsApi } from '../api'
import { NotifToggle } from './NotifToggle'
import type { NotificationPreferences } from '@repo/shared/types'

export function NotificationsPreferences() {
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()
  const notifQuery = useQuery(notificationQueries.preferences())
  const notifPrefs = notifQuery.data?.data as NotificationPreferences | undefined
  const [, setSavingNotifs] = useState(false)

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
