import { useTranslation } from 'react-i18next'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Switch } from '@/shared/components/ui/switch'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select'
import type { RecurrencePattern } from '@/features/recurring/api'
import type { RepeatState } from '../../hooks/use-task-form'

interface Props {
  value: RepeatState
  onChange: React.Dispatch<React.SetStateAction<RepeatState>>
}

const WEEK_DAYS = [
  { v: 1, l: 'L' },
  { v: 2, l: 'M' },
  { v: 3, l: 'X' },
  { v: 4, l: 'J' },
  { v: 5, l: 'V' },
  { v: 6, l: 'S' },
  { v: 0, l: 'D' },
]

export function RepeatField({ value, onChange }: Props) {
  const { t } = useTranslation('tasks')

  return (
    <div className="space-y-2 rounded-lg border border-border/40 p-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="repeatTask" className="cursor-pointer text-sm font-medium">
          {t('repeatTask')}
        </Label>
        <Switch
          id="repeatTask"
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange((s) => ({ ...s, enabled }))}
        />
      </div>
      {value.enabled && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('repeatPattern')}</Label>
            <Select
              value={value.pattern}
              onValueChange={(v) => onChange((s) => ({ ...s, pattern: v as RecurrencePattern }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">{t('daily')}</SelectItem>
                <SelectItem value="WEEKDAYS">{t('weekdays')}</SelectItem>
                <SelectItem value="WEEKLY">{t('weekly')}</SelectItem>
                <SelectItem value="MONTHLY">{t('monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.pattern === 'WEEKLY' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('repeatDays')}</Label>
              <div className="flex flex-wrap gap-1">
                {WEEK_DAYS.map((d) => {
                  const active = value.daysOfWeek.includes(d.v)
                  return (
                    <Button
                      key={d.v}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="icon"
                      onClick={() =>
                        onChange((s) => ({
                          ...s,
                          daysOfWeek: active
                            ? s.daysOfWeek.filter((x) => x !== d.v)
                            : [...s.daysOfWeek, d.v],
                        }))
                      }
                      className="text-xs font-medium"
                    >
                      {d.l}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('repeatTime')}</Label>
              <Input
                type="time"
                value={value.time}
                onChange={(e) => onChange((s) => ({ ...s, time: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('repeatEnd')}</Label>
              <Input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange((s) => ({ ...s, endDate: e.target.value }))}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t('repeatHint')}</p>
        </div>
      )}
    </div>
  )
}
