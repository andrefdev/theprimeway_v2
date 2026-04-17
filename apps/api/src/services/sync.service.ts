/**
 * In-memory WebSocket pub/sub for real-time client sync.
 * Single-node only (no Redis). Client-agnostic protocol — web/desktop/mobile
 * can all adopt by replicating the handshake + event shape.
 */
import type { WebSocket } from 'ws'

export type SyncEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'habit.logged'
  | 'pomodoro.started'
  | 'pomodoro.stopped'
  | 'calendar.event.updated'

export interface SyncEvent {
  type: SyncEventType
  payload: unknown
  at: string
}

class SyncService {
  private connections = new Map<string, Set<WebSocket>>()

  register(userId: string, ws: WebSocket) {
    let set = this.connections.get(userId)
    if (!set) {
      set = new Set()
      this.connections.set(userId, set)
    }
    set.add(ws)
  }

  unregister(userId: string, ws: WebSocket) {
    const set = this.connections.get(userId)
    if (!set) return
    set.delete(ws)
    if (set.size === 0) this.connections.delete(userId)
  }

  publish(userId: string, event: Omit<SyncEvent, 'at'>) {
    const set = this.connections.get(userId)
    if (!set || set.size === 0) return
    const payload = JSON.stringify({ ...event, at: new Date().toISOString() })
    for (const ws of set) {
      try {
        if (ws.readyState === ws.OPEN) ws.send(payload)
      } catch (err) {
        console.error('[SYNC] send failed', err)
      }
    }
  }

  stats() {
    let total = 0
    for (const set of this.connections.values()) total += set.size
    return { users: this.connections.size, connections: total }
  }
}

export const syncService = new SyncService()
