import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { Bubble } from '@/components/Bubble'
import { ExpandedPanel } from '@/components/ExpandedPanel'
import { useOverlayWindow } from '@/hooks/use-overlay-window'
import { useVoiceListener } from '@/hooks/use-voice-listener'
import { useTrayEvents } from '@/hooks/use-tray-events'
import { useOverlayStore } from '@/stores/overlay.store'
import { useOverlayAuthStore } from '@/stores/auth.store'

export default function App() {
  const { isExpanded } = useOverlayWindow()
  useVoiceListener()
  useTrayEvents()
  const { isListening } = useOverlayStore()
  const { fetchToken } = useOverlayAuthStore()

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  return (
    <div className="w-full h-full flex items-start justify-start p-5">
      <AnimatePresence mode="wait">
        {!isExpanded ? <Bubble key="bubble" /> : <ExpandedPanel key="panel" />}
      </AnimatePresence>

      {isListening && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-500">
          🎤 Voice recognition active
        </div>
      )}
    </div>
  )
}
