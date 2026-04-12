export type FinanceEventType =
  | 'FINANCE_ACCOUNT_CREATED'
  | 'FINANCE_ACCOUNT_UPDATED'
  | 'FINANCE_ACCOUNT_DELETED'
  | 'FINANCE_TRANSACTIONS_CHANGED'
  | 'FINANCE_BUDGETS_CHANGED'
  | 'FINANCE_STATS_CHANGED'

export interface FinanceEvent<T = unknown> {
  type: FinanceEventType
  payload?: T
  timestamp: number
}

const CHANNEL_NAME = 'theprimeway-finances'
const STORAGE_KEY = 'theprimeway:finances:event'

let channel: BroadcastChannel | null = null
let initialized = false

function ensureChannel() {
  if (initialized) return
  initialized = true
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME)
    }
  } catch {
    channel = null
  }
}

export function publishFinanceEvent<T = unknown>(
  type: FinanceEventType,
  payload?: T,
) {
  const event: FinanceEvent<T> = { type, payload, timestamp: Date.now() }
  ensureChannel()
  try {
    channel?.postMessage(event)
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      const key = `${STORAGE_KEY}:${event.timestamp}:${Math.random()}`
      window.localStorage.setItem(key, JSON.stringify(event))
      window.localStorage.removeItem(key)
    }
  } catch {}
}

export function subscribeFinanceEvents(
  handler: (event: FinanceEvent) => void,
) {
  ensureChannel()
  const bcHandler = (msg: MessageEvent<FinanceEvent>) => {
    if (msg?.data?.type) handler(msg.data)
  }
  const storageHandler = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(STORAGE_KEY)) return
    try {
      const event = JSON.parse(e.newValue || '{}')
      if (event?.type) handler(event)
    } catch {}
  }

  channel?.addEventListener('message', bcHandler)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler)
  }

  return () => {
    channel?.removeEventListener('message', bcHandler)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler)
    }
  }
}

export function subscribeFinanceEventType<T = unknown>(
  type: FinanceEventType,
  handler: (payload: T, event: FinanceEvent<T>) => void,
) {
  return subscribeFinanceEvents((event) => {
    if (event.type === type) handler(event.payload as T, event as FinanceEvent<T>)
  })
}
