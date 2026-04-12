import { useMemo, useCallback } from 'react'
import type { Task } from '@repo/shared/types'

interface TimeSlot {
  start: string // HH:mm
  end: string   // HH:mm
}

interface ScheduleResult {
  scheduledStart: string // ISO datetime
  scheduledEnd: string   // ISO datetime
}

interface WorkPreferences {
  startHour: number
  endHour: number
  defaultDurationMinutes: number
}

const DEFAULT_PREFS: WorkPreferences = {
  startHour: 8,
  endHour: 18,
  defaultDurationMinutes: 30,
}

/**
 * Finds available time slots in a day given existing tasks.
 * Used by TaskDialog to suggest scheduling times.
 */
export function useAutoScheduling(
  existingTasks: Task[],
  targetDate: string,
  prefs: WorkPreferences = DEFAULT_PREFS,
) {
  const occupiedSlots = useMemo(() => {
    return existingTasks
      .filter((t) => t.scheduledStart && t.scheduledEnd && t.status !== 'archived')
      .map((t) => ({
        start: extractMinutes(t.scheduledStart!),
        end: extractMinutes(t.scheduledEnd!),
      }))
      .sort((a, b) => a.start - b.start)
  }, [existingTasks])

  const findFreeSlots = useCallback(
    (durationMinutes: number): TimeSlot[] => {
      const workStart = prefs.startHour * 60
      const workEnd = prefs.endHour * 60
      const slots: TimeSlot[] = []

      let cursor = workStart
      for (const occupied of occupiedSlots) {
        if (occupied.start > cursor && occupied.start - cursor >= durationMinutes) {
          slots.push({
            start: minutesToTime(cursor),
            end: minutesToTime(cursor + durationMinutes),
          })
        }
        cursor = Math.max(cursor, occupied.end)
      }

      // Check remaining time after last task
      if (workEnd - cursor >= durationMinutes) {
        slots.push({
          start: minutesToTime(cursor),
          end: minutesToTime(cursor + durationMinutes),
        })
      }

      return slots
    },
    [occupiedSlots, prefs.startHour, prefs.endHour],
  )

  const autoSchedule = useCallback(
    (durationMinutes?: number): ScheduleResult | null => {
      const duration = durationMinutes ?? prefs.defaultDurationMinutes
      const slots = findFreeSlots(duration)

      if (slots.length === 0) return null

      // Prefer slots near peak productivity hours (10-12, 14-16)
      const scored = slots.map((slot) => {
        const startMin = timeToMinutes(slot.start)
        let score = 0
        if (startMin >= 600 && startMin <= 720) score += 10 // 10-12
        if (startMin >= 840 && startMin <= 960) score += 8  // 14-16
        if (startMin % 60 === 0) score += 2 // on the hour
        if (startMin % 30 === 0) score += 1 // half hour
        return { slot, score }
      })

      scored.sort((a, b) => b.score - a.score)
      const best = scored[0]!.slot

      return {
        scheduledStart: `${targetDate}T${best.start}:00`,
        scheduledEnd: `${targetDate}T${best.end}:00`,
      }
    },
    [findFreeSlots, targetDate, prefs.defaultDurationMinutes],
  )

  return { findFreeSlots, autoSchedule }
}

function extractMinutes(iso: string): number {
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}
