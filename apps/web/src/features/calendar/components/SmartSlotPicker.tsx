import { useState } from 'react'
import { calendarApi, type SmartSlot } from '../api'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useLocale } from '@/i18n/useLocale'
import { formatTime } from '@/i18n/format'

interface SmartSlotPickerProps {
  taskId: string
  taskTitle: string
  date?: string
  onScheduled?: (start: string, end: string) => void
}

export function SmartSlotPicker({ taskId, taskTitle, date, onScheduled }: SmartSlotPickerProps) {
  const { t } = useTranslation('common')
  const { locale } = useLocale()
  const targetDate = date ?? format(new Date(), 'yyyy-MM-dd')
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<SmartSlot[] | null>(null)
  const [bestSlot, setBestSlot] = useState<SmartSlot | null>(null)

  async function handleFind() {
    setLoading(true)
    try {
      const result = await calendarApi.findSmartSlots(taskId, targetDate)
      setSlots(result?.slots ?? [])
      setBestSlot(result?.bestSlot ?? null)
    } catch {
      toast.error(t('failedToLoad', { defaultValue: 'Failed to find slots' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(slot: SmartSlot) {
    const startTime = slot.start ?? slot.startTime
    const endTime = slot.end ?? slot.endTime
    if (!startTime || !endTime) return
    try {
      await calendarApi.createTimeBlock({
        title: taskTitle,
        date: targetDate,
        startTime,
        endTime,
      })
      toast.success(t('save', { defaultValue: 'Scheduled!' }))
      onScheduled?.(startTime, endTime)
    } catch {
      toast.error(t('failedToLoad', { defaultValue: 'Failed to schedule' }))
    }
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-foreground">{t('findBestTime', { defaultValue: 'Find Best Time' })}</h4>
          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={handleFind} disabled={loading}>
            {loading ? '...' : t('findBestTime', { defaultValue: 'Find Slots' })}
          </Button>
        </div>

        {slots && slots.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">{t('noSlotsFound', { defaultValue: 'No available slots found' })}</p>
        )}

        {slots && slots.length > 0 && (
          <div className="space-y-1">
            {slots.slice(0, 5).map((slot, i) => {
              const isBest = bestSlot && (slot.start === bestSlot.start || i === 0)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(slot)}
                  className={`w-full flex items-center gap-2 rounded border p-1.5 text-xs transition-colors hover:bg-muted/50 ${
                    isBest ? 'border-primary bg-primary/5' : 'border-border/50'
                  }`}
                >
                  <span className="font-mono text-muted-foreground">
                    {formatTime(slot.start ?? slot.startTime, locale)} - {formatTime(slot.end ?? slot.endTime, locale)}
                  </span>
                  {slot.score && (
                    <Badge variant="outline" className="text-[9px]">{Math.round(slot.score * 100)}%</Badge>
                  )}
                  {slot.reason && <span className="text-[10px] text-muted-foreground truncate">{slot.reason}</span>}
                  {isBest && <Badge className="text-[9px] ml-auto">{t('best', { defaultValue: 'Best' })}</Badge>}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

