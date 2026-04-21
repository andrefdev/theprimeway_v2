import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function isFirebaseConfigured(): boolean {
  return !!(config.apiKey && config.projectId && config.appId && config.messagingSenderId && VAPID_KEY)
}

function ensureApp() {
  if (!isFirebaseConfigured()) return null
  if (!app) {
    app = getApps()[0] ?? initializeApp(config as Record<string, string>)
  }
  return app
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null
  const a = ensureApp()
  if (!a) return null
  if (!messaging) messaging = getMessaging(a)
  return messaging
}

export async function requestFcmToken(): Promise<string | null> {
  const m = getFirebaseMessaging()
  if (!m || !VAPID_KEY) return null

  // Ensure FCM service worker is registered.
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/firebase-cloud-messaging-push-scope',
  })

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const token = await getToken(m, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    return token || null
  } catch (err) {
    console.error('[fcm] getToken failed', err)
    return null
  }
}

export function subscribeForegroundMessages(
  handler: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
) {
  const m = getFirebaseMessaging()
  if (!m) return () => {}
  return onMessage(m, (payload) => {
    handler({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string> | undefined,
    })
  })
}
