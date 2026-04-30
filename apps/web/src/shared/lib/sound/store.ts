import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SoundState {
  enabled: boolean
  masterVolume: number
  toggle: () => void
  setEnabled: (b: boolean) => void
  setVolume: (v: number) => void
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      masterVolume: 0.7,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
      setEnabled: (b) => set({ enabled: b }),
      setVolume: (v) => set({ masterVolume: Math.max(0, Math.min(1, v)) }),
    }),
    { name: 'tpw.sound.prefs' },
  ),
)
