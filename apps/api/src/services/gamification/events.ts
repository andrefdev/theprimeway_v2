import { EventEmitter } from 'node:events'

export type GamificationEventType =
  | 'task.completed'
  | 'task.uncompleted'
  | 'habit.logged'
  | 'pomodoro.completed'
  | 'goal.created'
  | 'xp.awarded'
  | 'streak.updated'
  | 'rank.updated'
  | 'challenge.completed'
  | 'note.created'
  | 'book.finished'
  | 'quarterly.progress.updated'
  | 'brain.entry.created'

export interface GamificationEventPayload {
  userId: string
  meta?: Record<string, unknown>
}

type Handler = (payload: GamificationEventPayload) => void | Promise<void>

class GamificationEventBus {
  private emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(50)
  }

  emit(type: GamificationEventType, payload: GamificationEventPayload) {
    this.emitter.emit(type, payload)
  }

  on(type: GamificationEventType, handler: Handler) {
    this.emitter.on(type, handler)
  }

  off(type: GamificationEventType, handler: Handler) {
    this.emitter.off(type, handler)
  }
}

export const gamificationEvents = new GamificationEventBus()
