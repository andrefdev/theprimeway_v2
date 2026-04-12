import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { Bubble } from '@/components/Bubble'
import { ExpandedPanel } from '@/components/ExpandedPanel'
import { useOverlayWindow } from '@/hooks/use-overlay-window'
import { useVoiceListener } from '@/hooks/use-voice-listener'
import { useOverlayStore } from '@/stores/overlay.store'
import { useOverlayAuthStore } from '@/stores/auth.store'
import { listen } from '@tauri-apps/api/event'

// Signal to trigger timer start from tray
let triggerTimerStart: (() => void) | null = null

export function setTimerStartTrigger(fn: () => void) {
  triggerTimerStart = fn
}

export function triggerTimerStartFromTray() {
  if (triggerTimerStart) {
    triggerTimerStart()
  }
}

export default function App() {
  const { isExpanded } = useOverlayWindow()
  useVoiceListener()
  const { isListening } = useOverlayStore()
  const { fetchToken } = useOverlayAuthStore()
  const unlistenRef = useRef<(() => void) | null>(null)

  // Initialize auth token from Rust on mount
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Listen for tray-start-timer event
  useEffect(() => {
    const setupListener = async () => {
      try {
        unlistenRef.current = await listen<void>('tray-start-timer', () => {
          triggerTimerStartFromTray()
        })
      } catch (error) {
        console.error('Failed to listen to tray-start-timer:', error)
      }
    }

    setupListener()

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, [])

  return (
    <div className="w-full h-full flex items-start justify-start p-5">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <Bubble key="bubble" />
        ) : (
          <ExpandedPanel key="panel" />
        )}
      </AnimatePresence>

      {isListening && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-500">
          🎤 Voice recognition active
        </div>
      )}
    </div>
  )
}
