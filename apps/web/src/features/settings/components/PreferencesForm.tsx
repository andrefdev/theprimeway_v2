import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { toast } from 'sonner'
import { useTheme } from '@/shared/providers/theme-provider'
import { useUpdateSettings } from '../queries'
import type { UserSettings } from '../api'

interface PreferencesFormProps {
  settings: UserSettings | null
  saving: boolean
  onSettingsChange: (key: keyof UserSettings, value: string) => void
  isPremium?: boolean  // Enables custom theme creation features
}

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
]

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'COP', label: 'COP ($)' },
  { value: 'MXN', label: 'MXN ($)' },
  { value: 'BRL', label: 'BRL (R$)' },
]

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Denver', label: 'Mountain (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'America/Bogota', label: 'Colombia' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Lima', label: 'Lima' },
  { value: 'America/Santiago', label: 'Santiago' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Madrid', label: 'Madrid' },
]

export function PreferencesForm({ settings, saving, onSettingsChange }: PreferencesFormProps) {
  const { t } = useTranslation('settings')
  const { i18n } = useTranslation()
  const { setTheme } = useTheme()
  const updateSettings = useUpdateSettings()

  async function handleSave() {
    if (!settings) return
    try {
      await updateSettings.mutateAsync(settings)
      if (settings.locale && i18n.language !== settings.locale) {
        await i18n.changeLanguage(settings.locale)
      }
      if (settings.theme) {
        setTheme(settings.theme as 'light' | 'dark' | 'system')
      }
      toast.success(t('settingsSaved'))
    } catch {
      toast.error(t('failedToSave'))
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('preferences')}</h3>

        {!settings ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('language')}</Label>
              <Select value={settings.locale} onValueChange={(v) => onSettingsChange('locale', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('theme')}</Label>
              <Select value={settings.theme} onValueChange={(v) => onSettingsChange('theme', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.value === 'dark' ? 'themeDark' : opt.value === 'light' ? 'themeLight' : 'themeSystem')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('timezone')}</Label>
              <Select value={settings.timezone} onValueChange={(v) => onSettingsChange('timezone', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('currency')}</Label>
              <Select value={settings.baseCurrency || 'USD'} onValueChange={(v) => onSettingsChange('baseCurrency', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving || updateSettings.isPending}>
            {t('savePreferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
