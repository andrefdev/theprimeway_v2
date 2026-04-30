import { useEffect } from 'react'

interface KeyboardArgs {
  enabled: boolean
  onTogglePlay: () => void
  onComplete: () => void
  onClose: () => void
}

export function useFocusKeyboard({ enabled, onTogglePlay, onComplete, onClose }: KeyboardArgs) {
  useEffect(() => {
    if (!enabled) return
    function handle(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
      if (e.key === ' ') {
        e.preventDefault()
        onTogglePlay()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onComplete()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [enabled, onTogglePlay, onComplete, onClose])
}
