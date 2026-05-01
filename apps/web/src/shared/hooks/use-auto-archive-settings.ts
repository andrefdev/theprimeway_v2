import { useCallback, useEffect, useState } from 'react'

export interface AutoArchiveSettings {
  enabled: boolean
  days: number
}

const DEFAULT_SETTINGS: AutoArchiveSettings = { enabled: true, days: 1 }
const ALLOWED_DAYS = [1, 2, 3, 4, 5, 7]

function readStored(key: string): AutoArchiveSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AutoArchiveSettings>
    const enabled = typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_SETTINGS.enabled
    const daysCandidate = typeof parsed?.days === 'number' ? parsed.days : DEFAULT_SETTINGS.days
    const days = ALLOWED_DAYS.includes(daysCandidate) ? daysCandidate : DEFAULT_SETTINGS.days
    return { enabled, days }
  } catch {
    return null
  }
}

export function usePersistentAutoArchiveSettings(
  storageKey: string = 'tasks.autoArchive',
): [AutoArchiveSettings, { setEnabled: (v: boolean) => void; setDays: (n: number) => void }] {
  const [settings, setSettings] = useState<AutoArchiveSettings>(() => readStored(storageKey) ?? DEFAULT_SETTINGS)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch {
      // ignore quota / unavailable errors
    }
  }, [storageKey, settings])

  const setEnabled = useCallback((v: boolean) => setSettings((s) => ({ ...s, enabled: v })), [])
  const setDays = useCallback(
    (n: number) => setSettings((s) => ({ ...s, days: ALLOWED_DAYS.includes(n) ? n : DEFAULT_SETTINGS.days })),
    [],
  )

  return [settings, { setEnabled, setDays }]
}

export const AUTO_ARCHIVE_DAY_OPTIONS = ALLOWED_DAYS
