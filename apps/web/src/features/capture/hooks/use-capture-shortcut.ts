import { useEffect, useState } from 'react'

/**
 * Global Cmd/Ctrl+K listener that toggles a boolean. Use the returned
 * tuple to render <CaptureDialog open={open} onClose={close} />.
 *
 * Skips typing contexts (INPUT/TEXTAREA/contentEditable) unless already open.
 */
export function useCaptureShortcut(): [boolean, () => void] {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      const isK = (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k'
      if (!isK) return
      if (!open) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      }
      e.preventDefault()
      setOpen((v) => !v)
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  return [open, close]
}
