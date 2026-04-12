import { useEffect } from 'react'
import { resizeOverlay, showOverlay } from '@/lib/tauri-bridge'
import { useOverlayStore } from '@/stores/overlay.store'

export function useOverlayWindow() {
  const { isExpanded, setExpanded } = useOverlayStore()

  const expand = async () => {
    setExpanded(true)
    await resizeOverlay(320, 200)
    await showOverlay()
  }

  const collapse = async () => {
    setExpanded(false)
    await resizeOverlay(72, 72)
  }

  useEffect(() => {
    const handleMouseEnter = () => expand()
    const handleMouseLeave = () => collapse()

    const root = document.documentElement
    root.addEventListener('mouseenter', handleMouseEnter)
    root.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      root.removeEventListener('mouseenter', handleMouseEnter)
      root.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return { isExpanded, expand, collapse }
}
