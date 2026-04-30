import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useWorkingHours, useBulkReplaceWorkingHours } from '../queries'

interface DayState {
  enabled: boolean
  startTime: string
  endTime: string
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun

const EMPTY_DAY: DayState = { enabled: false, startTime: '09:00', endTime: '17:00' }

const DEFAULTS: Record<number, DayState> = {
  0: { enabled: false, startTime: '09:00', endTime: '17:00' },
  1: { enabled: true, startTime: '09:00', endTime: '17:00' },
  2: { enabled: true, startTime: '09:00', endTime: '17:00' },
  3: { enabled: true, startTime: '09:00', endTime: '17:00' },
  4: { enabled: true, startTime: '09:00', endTime: '17:00' },
  5: { enabled: true, startTime: '09:00', endTime: '17:00' },
  6: { enabled: false, startTime: '09:00', endTime: '17:00' },
}

function buildInitialState(rows: { dayOfWeek: number; startTime: string; endTime: string }[]): Record<number, DayState> {
  const map: Record<number, DayState> = {
    0: { ...EMPTY_DAY },
    1: { ...EMPTY_DAY },
    2: { ...EMPTY_DAY },
    3: { ...EMPTY_DAY },
    4: { ...EMPTY_DAY },
    5: { ...EMPTY_DAY },
    6: { ...EMPTY_DAY },
  }
  for (const r of rows) {
    map[r.dayOfWeek] = { enabled: true, startTime: r.startTime, endTime: r.endTime }
  }
  return map
}

export function WorkingHoursManager() {
  const { t } = useTranslation('settings')
  const { data: rows, isLoading } = useWorkingHours()
  const bulkReplace = useBulkReplaceWorkingHours()
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitialState([]))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (rows && !hydrated) {
      setDays(buildInitialState(rows))
      setHydrated(true)
    }
  }, [rows, hydrated])

  function setDay(dow: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [dow]: { ...(prev[dow] ?? EMPTY_DAY), ...patch } }))
  }

  function applyDefaults() {
    const next: Record<number, DayState> = {}
    for (let i = 0; i < 7; i++) next[i] = { ...DEFAULTS[i]! }
    setDays(next)
  }

  async function handleSave() {
    const enabledRows = Object.entries(days)
      .filter(([, s]) => s.enabled)
      .map(([dow, s]) => ({
        dayOfWeek: Number(dow),
        startTime: s.startTime,
        endTime: s.endTime,
      }))

    for (const r of enabledRows) {
      if (r.endTime <= r.startTime) {
        toast.error(t('workingHours.invalidRange', { defaultValue: 'End time must be after start time' }))
        return
      }
    }

    try {
      await bulkReplace.mutateAsync(enabledRows)
      toast.success(t('settingsSaved'))
    } catch {
      toast.error(t('failedToSave'))
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('workingHours.title', { defaultValue: 'Working hours' })}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t('workingHours.description', {
              defaultValue:
                'Auto-Schedule uses these hours to find slots. Days left off cannot be auto-scheduled.',
            })}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {DAY_ORDER.map((dow) => {
              const s = days[dow] ?? EMPTY_DAY
              return (
                <div
                  key={dow}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2 border-b last:border-b-0"
                >
                  <Label className="text-sm">
                    {t(`workingHours.day.${dow}`, { defaultValue: defaultDayLabel(dow) })}
                  </Label>
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(v) => setDay(dow, { enabled: v })}
                    aria-label={t('workingHours.enabled', { defaultValue: 'Enabled' })}
                  />
                  <input
                    type="time"
                    value={s.startTime}
                    disabled={!s.enabled}
                    onChange={(e) => setDay(dow, { startTime: e.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm disabled:opacity-50"
                  />
                  <input
                    type="time"
                    value={s.endTime}
                    disabled={!s.enabled}
                    onChange={(e) => setDay(dow, { endTime: e.target.value })}
                    className="bg-background border border-input rounded-md px-2 py-1 text-sm disabled:opacity-50"
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={applyDefaults} disabled={isLoading || bulkReplace.isPending}>
            {t('workingHours.reset', { defaultValue: 'Use defaults (Mon–Fri 9–5)' })}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || bulkReplace.isPending}>
            {t('workingHours.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function defaultDayLabel(dow: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow] ?? ''
}
