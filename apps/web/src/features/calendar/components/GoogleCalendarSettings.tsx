import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Switch } from '@/shared/components/ui/switch'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { calendarApi, type Calendar } from '../api'
import {
  calendarQueries,
  useConnectGoogleCalendar,
  useUpdateCalendar,
  useDeleteCalendarAccount,
} from '../queries'

export function GoogleCalendarSettings() {
  const { t } = useTranslation('settings')
  const { data: accounts, isLoading } = useQuery(calendarQueries.accounts())
  const connect = useConnectGoogleCalendar()
  const updateCalendar = useUpdateCalendar()
  const deleteAccount = useDeleteCalendarAccount()
  const handledCode = useRef(false)

  useEffect(() => {
    if (handledCode.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const err = params.get('error')
    if (!code && !err) return
    handledCode.current = true

    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('error')
    url.searchParams.delete('scope')
    url.searchParams.delete('state')
    window.history.replaceState({}, '', url.toString())

    if (err) {
      toast.error(t('googleCal.connectFailed', { defaultValue: 'Google Calendar connection failed' }))
      return
    }
    if (code) {
      connect
        .mutateAsync(code)
        .then(() =>
          toast.success(t('googleCal.connected', { defaultValue: 'Google Calendar connected' })),
        )
        .catch(() =>
          toast.error(t('googleCal.connectFailed', { defaultValue: 'Google Calendar connection failed' })),
        )
    }
  }, [connect, t])

  async function handleConnect() {
    try {
      const { url } = await calendarApi.getGoogleConnectUrl()
      window.location.href = url
    } catch {
      toast.error(t('googleCal.notConfigured', { defaultValue: 'Google Calendar is not configured' }))
    }
  }

  function toggleCalendar(cal: Calendar, next: boolean) {
    updateCalendar.mutate({ id: cal.id, body: { isSelectedForSync: next } })
  }

  const googleAccounts = (accounts ?? []).filter((a) => a.provider === 'google')

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t('googleCal.title', { defaultValue: 'Google Calendar' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('googleCal.description', {
                defaultValue: 'Connect your Google account and pick which calendars to sync.',
              })}
            </p>
          </div>
          <Button onClick={handleConnect} size="sm" disabled={connect.isPending}>
            {googleAccounts.length > 0
              ? t('googleCal.addAnother', { defaultValue: 'Add account' })
              : t('googleCal.connect', { defaultValue: 'Connect' })}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : googleAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('googleCal.noAccounts', { defaultValue: 'No Google accounts connected yet.' })}
          </p>
        ) : (
          <div className="space-y-4">
            {googleAccounts.map((acc) => (
              <div key={acc.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{acc.email ?? acc.id}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          t('googleCal.disconnectConfirm', {
                            defaultValue: 'Disconnect this Google account?',
                          }),
                        )
                      ) {
                        deleteAccount.mutate(acc.id)
                      }
                    }}
                  >
                    {t('googleCal.disconnect', { defaultValue: 'Disconnect' })}
                  </Button>
                </div>

                {(acc.calendars ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('googleCal.noCalendars', {
                      defaultValue: 'No calendars found for this account.',
                    })}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(acc.calendars ?? []).map((cal) => (
                      <li key={cal.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-3 rounded-full shrink-0"
                            style={{ backgroundColor: cal.color ?? '#999' }}
                          />
                          <span className="text-sm truncate">{cal.name}</span>
                          {cal.isPrimary ? (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {t('googleCal.primary', { defaultValue: 'primary' })}
                            </span>
                          ) : null}
                        </div>
                        <Switch
                          checked={!!cal.isSelectedForSync}
                          onCheckedChange={(v) => toggleCalendar(cal, v)}
                          disabled={updateCalendar.isPending}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
