import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/stores/auth.store'

interface SyncEvent {
  type: string
  payload?: { id?: string }
  at?: string
}

function resolveSyncUrl(token: string) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host
  return `${proto}://${host}/api/sync?token=${encodeURIComponent(token)}`
}

/** Mount once inside the authenticated layout. */
export function useSyncSocket() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const attemptRef = useRef(0)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (!token) return
    stoppedRef.current = false

    function connect() {
      if (stoppedRef.current) return
      try {
        const ws = new WebSocket(resolveSyncUrl(token!))
        wsRef.current = ws

        ws.addEventListener('open', () => {
          attemptRef.current = 0
        })

        ws.addEventListener('message', (e) => {
          let evt: SyncEvent | null = null
          try {
            evt = JSON.parse(e.data as string)
          } catch {
            return
          }
          if (!evt?.type) return
          routeEvent(evt)
        })

        ws.addEventListener('close', () => {
          wsRef.current = null
          if (stoppedRef.current) return
          const delay = Math.min(30_000, 500 * 2 ** attemptRef.current++)
          setTimeout(connect, delay)
        })

        ws.addEventListener('error', () => {
          try {
            ws.close()
          } catch {}
        })
      } catch (err) {
        console.error('[SYNC_WS] connect failed', err)
      }
    }

    function routeEvent(evt: SyncEvent) {
      switch (evt.type) {
        case 'task.created':
        case 'task.updated':
        case 'task.deleted':
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['calendar'] })
          break
        case 'habit.logged':
          queryClient.invalidateQueries({ queryKey: ['habits'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          break
        case 'pomodoro.started':
        case 'pomodoro.stopped':
          queryClient.invalidateQueries({ queryKey: ['pomodoro'] })
          break
        case 'calendar.event.updated':
          queryClient.invalidateQueries({ queryKey: ['calendar'] })
          break
        case 'session.created':
        case 'session.updated':
        case 'session.deleted':
          queryClient.invalidateQueries({ queryKey: ['working-sessions'] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          break
      }
    }

    connect()

    return () => {
      stoppedRef.current = true
      try {
        wsRef.current?.close()
      } catch {}
      wsRef.current = null
    }
  }, [token, queryClient])
}
