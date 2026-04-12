import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { settingsApi, type UserSettings } from '../../features/settings/api'
import { PreferencesForm } from '../../features/settings/components/preferences-form'
import { ChangePasswordForm } from '../../features/settings/components/change-password-form'
import { DangerZone } from '../../features/settings/components/danger-zone'
import { NotificationsPreferences } from '../../features/notifications/components/notifications-preferences'
import { useFeature } from '../../features/feature-flags/hooks'
import { FEATURES } from '@repo/shared/constants'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useTranslation('settings')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const customThemesFeature = useFeature(FEATURES.CUSTOM_THEMES)
  const exportDataFeature = useFeature(FEATURES.EXPORT_DATA)

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((r) => setSettings(r.data.data))
      .catch(() => {})
  }, [])

  function update(key: keyof UserSettings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>

        {/* Only show preferences form if custom themes are available, else show limited version */}
        {customThemesFeature.enabled ? (
          <PreferencesForm settings={settings} saving={saving} onSettingsChange={update} />
        ) : (
          <div className="text-sm text-muted-foreground p-4 rounded-lg border">
            {t('customThemesLocked')}
          </div>
        )}

        <NotificationsPreferences />
        <ChangePasswordForm />

        {/* Only show DangerZone if export data is available */}
        {exportDataFeature.enabled && <DangerZone />}
      </div>
    </div>
  )
}

