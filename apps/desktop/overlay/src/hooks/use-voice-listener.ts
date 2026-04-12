import { useEffect, useState } from 'react'
import { listenToVoiceActivate } from '@/lib/tauri-bridge'
import { useOverlayStore } from '@/stores/overlay.store'

export function useVoiceListener() {
  const [isSupported, setIsSupported] = useState(false)
  const { setListening, setLastCommand } = useOverlayStore()

  useEffect(() => {
    // Check if Web Speech API is available
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SR)
  }, [])

  useEffect(() => {
    const setupVoiceListener = async () => {
      const unlisten = await listenToVoiceActivate(async () => {
        if (!isSupported) return

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SR()

        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => setListening(true)

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setListening(false)
          setLastCommand(transcript)
        }

        recognition.onerror = () => setListening(false)
        recognition.onend = () => setListening(false)

        recognition.start()
      })

      return unlisten
    }

    if (isSupported) {
      let unlistenFn: (() => void) | null = null

      setupVoiceListener().then((fn) => {
        unlistenFn = fn
      })

      return () => {
        if (unlistenFn) unlistenFn()
      }
    }
  }, [isSupported, setListening, setLastCommand])

  return { isSupported }
}
