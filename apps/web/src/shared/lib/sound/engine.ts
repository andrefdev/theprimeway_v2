import { Howl } from 'howler'
import { SOUND_REGISTRY, type SoundKey } from './sounds'
import { useSoundStore } from './store'

const cache = new Map<SoundKey, Howl>()

function getHowl(key: SoundKey): Howl {
  const cached = cache.get(key)
  if (cached) return cached
  const def = SOUND_REGISTRY[key]
  const howl = new Howl({
    src: [def.src],
    volume: def.volume,
    preload: true,
    html5: false,
    onloaderror: (_id, err) => {
      console.warn(`[sound] failed to load ${key} (${def.src}):`, err)
    },
  })
  cache.set(key, howl)
  return howl
}

export function playSound(key: SoundKey): void {
  const { enabled, masterVolume } = useSoundStore.getState()
  if (!enabled) return
  try {
    const howl = getHowl(key)
    howl.volume(SOUND_REGISTRY[key].volume * masterVolume)
    howl.play()
  } catch (e) {
    console.warn(`[sound] play failed for ${key}:`, e)
  }
}

export function preloadSounds(keys: SoundKey[]): void {
  for (const k of keys) getHowl(k)
}
