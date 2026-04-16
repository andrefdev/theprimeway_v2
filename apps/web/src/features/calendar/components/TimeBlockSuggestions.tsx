import { useState } from 'react'
import { calendarApi } from '../api'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function TimeBlockSuggestions() {
  const { t } = useTranslation('common')
  const today = format(new Date(), 'yyyy-MM-dd')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState<any[] | null>(null)

  async function handleGenerate() {
    setLoading(true)
    try {
      const result = await calendarApi.getTimeBlocks(today)
      setBlocks(result?.blocks ?? result ?? [])
    } catch {
      toast.error(t('failedToLoad', { defaultValue: 'Failed to generate schedule' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyBlock(block: any) {
    try {
      await calendarApi.createTimeBlock({
        title: block.taskTitle ?? block.title,
        date: today,
        startTime: block.start ?? block.startTime,
        endTime: block.end ?? block.endTime,
        description: block.reason,
      })
      toast.success(t('save', { defaultValue: 'Block added to calendar' }))
    } catch {
      toast.error(t('failedToLoad', { defaultValue: 'Failed to add block' }))
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t('timeBlocking', { defaultValue: 'AI Time Blocking' })}</h3>
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
            {loading ? '...' : t('generateSchedule', { defaultValue: 'Auto-schedule' })}
          </Button>
        </div>

        {blocks && blocks.length === 0 && (
          <p className="text-xs text-muted-foreground italic">{t('noTasksForDay', { defaultValue: 'No tasks to schedule' })}</p>
        )}

        {blocks && blocks.length > 0 && (
          <div className="space-y-1.5">
            {blocks.map((block: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded border border-border/50 p-2 text-xs">
                <span className="text-muted-foreground font-mono w-24 shrink-0">
                  {formatTime(block.start ?? block.startTime)} - {formatTime(block.end ?? block.endTime)}
                </span>
                <span className="text-foreground flex-1 truncate">{block.taskTitle ?? block.title}</span>
                {block.reason && (
                  <Badge variant="outline" className="text-[9px] shrink-0">{block.reason}</Badge>
                )}
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => handleApplyBlock(block)}>
                  +
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
