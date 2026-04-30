import { useCallback, useEffect, useState } from 'react'
import {
  buildRange,
  type DateRange,
  type DateRangePreset,
} from '@/shared/lib/date-ranges'

interface StoredRange {
  preset: DateRangePreset
  start?: string | null
  end?: string | null
}

function readStored(key: string): StoredRange | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRange
    if (!parsed?.preset) return null
    return parsed
  } catch {
    return null
  }
}

export function usePersistentDateRange(
  storageKey: string,
  defaultPreset: DateRangePreset = 'this_month',
): [DateRange, (next: DateRange) => void] {
  const [range, setRange] = useState<DateRange>(() => {
    const stored = readStored(storageKey)
    if (!stored) return buildRange(defaultPreset)
    if (stored.preset === 'custom') {
      return {
        preset: 'custom',
        start: stored.start ?? null,
        end: stored.end ?? null,
      }
    }
    return buildRange(stored.preset)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload: StoredRange =
      range.preset === 'custom'
        ? { preset: 'custom', start: range.start, end: range.end }
        : { preset: range.preset }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // ignore quota / unavailable errors
    }
  }, [storageKey, range])

  const update = useCallback((next: DateRange) => setRange(next), [])

  return [range, update]
}
