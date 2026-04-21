import { isFirebaseConfigured, requestFcmToken, subscribeForegroundMessages } from '@/lib/firebase'
import { notificationsApi } from './api'

const TOKEN_STORAGE_KEY = 'tpw.fcmToken'

export async function enableWebPush(): Promise<
  | { ok: true; token: string }
  | { ok: false; reason: 'not_configured' | 'permission_denied' | 'unsupported' | 'error' }
> {
  if (!isFirebaseConfigured()) return { ok: false, reason: 'not_configured' }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported' }
  }

  try {
    const token = await requestFcmToken()
    if (!token) return { ok: false, reason: 'permission_denied' }

    const prev = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (prev !== token) {
      await notificationsApi.registerDevice(token, 'web')
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    }
    return { ok: true, token }
  } catch (err) {
    console.error('[push] enable failed', err)
    return { ok: false, reason: 'error' }
  }
}

export async function disableWebPush(): Promise<void> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    try {
      await notificationsApi.unregisterDevice(token)
    } catch (err) {
      console.error('[push] unregister failed', err)
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function isPushEnabledLocally(): boolean {
  return !!localStorage.getItem(TOKEN_STORAGE_KEY)
}

export { subscribeForegroundMessages }
