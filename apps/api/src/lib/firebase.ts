import admin from 'firebase-admin'
import type { Messaging } from 'firebase-admin/messaging'
import * as Sentry from '@sentry/node'

let initialized = false
let enabled = false

function init() {
  if (initialized) return
  initialized = true

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn('[firebase] missing credentials; push disabled')
    return
  }

  // Support escaped newlines from env vars.
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      })
    }
    enabled = true
  } catch (err) {
    console.error('[firebase] init failed', err)
    Sentry.captureException(err, { tags: { area: 'firebase_init' } })
  }
}

export function isPushEnabled() {
  init()
  return enabled
}

export function getMessaging(): Messaging | null {
  init()
  if (!enabled) return null
  return admin.messaging()
}
