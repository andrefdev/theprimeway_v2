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
    console.warn('[firebase] missing credentials; FCM (web) push disabled')
    return
  }

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

export function isFcmEnabled() {
  init()
  return enabled
}

export function getMessaging(): Messaging | null {
  init()
  if (!enabled) return null
  return admin.messaging()
}

export interface FcmSendResult {
  successCount: number
  failureCount: number
  invalidTokens: string[]
}

export async function sendFcm(
  tokens: string[],
  payload: { title: string; body: string; url?: string; tag?: string; image?: string; data?: unknown },
): Promise<FcmSendResult> {
  const messaging = getMessaging()
  if (!messaging || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] }
  }

  const FCM_MULTICAST_LIMIT = 500
  const chunks: string[][] = []
  for (let i = 0; i < tokens.length; i += FCM_MULTICAST_LIMIT) {
    chunks.push(tokens.slice(i, i + FCM_MULTICAST_LIMIT))
  }

  const messagePayload = {
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.image ? { imageUrl: payload.image } : {}),
    },
    data: {
      ...(payload.url ? { url: payload.url } : {}),
      ...(payload.tag ? { tag: payload.tag } : {}),
      ...(payload.data ? { payload: JSON.stringify(payload.data) } : {}),
    },
    webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
  }

  let successCount = 0
  let failureCount = 0
  const invalidTokens: string[] = []

  for (const chunkTokens of chunks) {
    const res = await messaging.sendEachForMulticast({ tokens: chunkTokens, ...messagePayload })
    successCount += res.successCount
    failureCount += res.failureCount

    res.responses.forEach((r, i) => {
      if (r.success) return
      const code = r.error?.code ?? ''
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        const token = chunkTokens[i]
        if (token) invalidTokens.push(token)
      }
    })
  }

  return { successCount, failureCount, invalidTokens }
}
