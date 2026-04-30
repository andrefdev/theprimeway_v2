import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useSound } from '@/shared/lib/sound'

export function SoundPreferences() {
  const { t } = useTranslation('settings')
  const { enabled, masterVolume, setEnabled, setVolume, play } = useSound()

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="text-base font-semibold">{t('sounds.title', { defaultValue: 'Sounds' })}</h3>
          <p className="text-sm text-muted-foreground">
            {t('sounds.description', { defaultValue: 'Play feedback sounds for completions and navigation.' })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled">{t('sounds.enabled', { defaultValue: 'Enable sounds' })}</Label>
          <Switch id="sound-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-volume">{t('sounds.volume', { defaultValue: 'Volume' })}</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <input
            id="sound-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            disabled={!enabled}
            value={Math.round(masterVolume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full accent-primary disabled:opacity-50"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!enabled}
          onClick={() => play('taskComplete')}
        >
          {t('sounds.test', { defaultValue: 'Test sound' })}
        </Button>
      </CardContent>
    </Card>
  )
}
