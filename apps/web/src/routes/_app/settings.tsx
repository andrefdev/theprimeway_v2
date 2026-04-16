import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { settingsApi, type UserSettings } from '@/features/settings/api'
import { PreferencesForm } from '@/features/settings/components/PreferencesForm'
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm'
import { DangerZone } from '@/features/settings/components/DangerZone'
import { NotificationsPreferences } from '@/features/notifications/components/NotificationsPreferences'
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
  const customThemeCreationFeature = useFeature(FEATURES.CUSTOM_THEME_CREATION)
  const exportDataFeature = useFeature(FEATURES.EXPORT_DATA)

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((r) => setSettings(r.data.data))
      .catch(() => toast.error(t('loadSettingsFailed', { defaultValue: 'Failed to load settings' })))
  }, [])

  function update(key: keyof UserSettings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>

        {/* Preferences form: show limited version for all, full version if premium */}
        <PreferencesForm settings={settings} saving={saving} onSettingsChange={update} isPremium={customThemeCreationFeature.enabled} />

        <NotificationsPreferences />
        <ChangePasswordForm />

        {/* Only show DangerZone if export data is available */}
        {exportDataFeature.enabled && <DangerZone />}
      </div>
    </div>
  )
}

