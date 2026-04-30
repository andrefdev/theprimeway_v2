import { useSoundStore } from './store'
import { playSound } from './engine'
import type { SoundKey } from './sounds'

export function useSound() {
  const enabled = useSoundStore((s) => s.enabled)
  const masterVolume = useSoundStore((s) => s.masterVolume)
  const toggle = useSoundStore((s) => s.toggle)
  const setEnabled = useSoundStore((s) => s.setEnabled)
  const setVolume = useSoundStore((s) => s.setVolume)

  return {
    play: (key: SoundKey) => playSound(key),
    enabled,
    masterVolume,
    toggle,
    setEnabled,
    setVolume,
  }
}
