import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { settingsApi, type UserSettings } from '@/features/settings/api'
import { PreferencesForm } from '@/features/settings/components/PreferencesForm'
import { SoundPreferences } from '@/features/settings/components/SoundPreferences'
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm'
import { DangerZone } from '@/features/settings/components/DangerZone'
import { NotificationsPreferences } from '@/features/notifications/components/NotificationsPreferences'
import { GoogleCalendarSettings } from '@/features/calendar/components/GoogleCalendarSettings'
import { useConnectGoogleCalendar } from '@/features/calendar/queries'
import { ApiKeysCard } from '@/features/integrations/components/ApiKeysCard'
import { WebhooksCard } from '@/features/integrations/components/WebhooksCard'
import { ChannelsManager } from '@/features/channels/components/ChannelsManager'
import { WorkingHoursManager } from '@/features/working-hours/components/WorkingHoursManager'
import { UsageLimits } from '@/features/subscriptions/components/UsageLimits'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { useFeature } from '@/features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation('settings')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [saving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const customThemeCreationFeature = useFeature(FEATURES.CUSTOM_THEME_CREATION)
  const exportDataFeature = useFeature(FEATURES.EXPORT_DATA)
  const connectGoogle = useConnectGoogleCalendar()
  const handledOAuthRef = useRef(false)

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((r) => setSettings(r.data.data))
      .catch(() => toast.error(t('loadSettingsFailed', { defaultValue: 'Failed to load settings' })))
  }, [])

  // Handle Google Calendar OAuth callback at the parent level so it processes
  // immediately regardless of which tab the user lands on.
  useEffect(() => {
    if (handledOAuthRef.current) return
    const params = new URLSearchParams(window.location.search)
    const state = params.get('state')
    if (state !== 'calendar_oauth') return
    const code = params.get('code')
    const err = params.get('error')
    if (!code && !err) return
    handledOAuthRef.current = true

    setActiveTab('integrations')

    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('error')
    url.searchParams.delete('scope')
    url.searchParams.delete('state')
    url.searchParams.delete('authuser')
    url.searchParams.delete('prompt')
    window.history.replaceState({}, '', url.toString())

    if (err) {
      toast.error(`Google Calendar: ${err}`)
      return
    }
    if (code) {
      connectGoogle
        .mutateAsync(code)
        .then(() => toast.success(t('googleCal.connected', { defaultValue: 'Google Calendar connected' })))
        .catch((e: any) => {
          const detail =
            e?.response?.data?.error ?? e?.data?.error ?? e?.message ?? 'connection failed'
          toast.error(`Google Calendar: ${detail}`)
        })
    }
  }, [connectGoogle, t])

  function update(key: keyof UserSettings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1">
          <TabsTrigger value="general">{t('tabGeneral')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('tabSchedule', { defaultValue: 'Schedule' })}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabNotifications')}</TabsTrigger>
          <TabsTrigger value="channels">{t('tabChannels')}</TabsTrigger>
          <TabsTrigger value="integrations">{t('tabIntegrations')}</TabsTrigger>
          <TabsTrigger value="plan">{t('tabPlan', { defaultValue: 'Plan' })}</TabsTrigger>
          <TabsTrigger value="account">{t('tabAccount')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 pt-4">
          <PreferencesForm
            settings={settings}
            saving={saving}
            onSettingsChange={update}
            isPremium={customThemeCreationFeature.enabled}
          />
          <SoundPreferences />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 pt-4">
          <WorkingHoursManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 pt-4">
          <NotificationsPreferences />
        </TabsContent>

        <TabsContent value="channels" className="space-y-6 pt-4">
          <ChannelsManager />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 pt-4">
          <GoogleCalendarSettings />
          <ApiKeysCard />
          <WebhooksCard />
        </TabsContent>

        <TabsContent value="plan" className="space-y-6 pt-4">
          <UsageLimits />
        </TabsContent>

        <TabsContent value="account" className="space-y-6 pt-4">
          <ChangePasswordForm />
          {exportDataFeature.enabled && <DangerZone />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
