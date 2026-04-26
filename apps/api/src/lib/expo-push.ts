import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'
import * as Sentry from '@sentry/node'

let expo: Expo | null = null
let initialized = false

function init() {
  if (initialized) return
  initialized = true

  try {
    expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
      useFcmV1: true,
    })
  } catch (err) {
    console.error('[expo-push] init failed', err)
    Sentry.captureException(err, { tags: { area: 'expo_push_init' } })
  }
}

export function isPushEnabled() {
  init()
  return expo !== null
}

export function getExpo(): Expo | null {
  init()
  return expo
}

export function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token)
}

export interface SendResult {
  successCount: number
  failureCount: number
  invalidTokens: string[]
}

export async function sendExpoPush(
  tokens: string[],
  payload: { title: string; body: string; url?: string; tag?: string; image?: string; data?: unknown },
): Promise<SendResult> {
  const client = getExpo()
  if (!client) return { successCount: 0, failureCount: 0, invalidTokens: [] }

  const validPairs = tokens
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) => Expo.isExpoPushToken(t))

  const invalidTokens: string[] = tokens.filter((t) => !Expo.isExpoPushToken(t))
  if (validPairs.length === 0) {
    return { successCount: 0, failureCount: tokens.length, invalidTokens }
  }

  const messages: ExpoPushMessage[] = validPairs.map(({ t }) => ({
    to: t,
    title: payload.title,
    body: payload.body,
    sound: 'default',
    data: {
      ...(payload.url ? { url: payload.url } : {}),
      ...(payload.tag ? { tag: payload.tag } : {}),
      ...(payload.data ? { payload: payload.data } : {}),
    },
    ...(payload.image ? { richContent: { image: payload.image } } : {}),
  }))

  const chunks = client.chunkPushNotifications(messages)
  const tickets: ExpoPushTicket[] = []

  for (const chunk of chunks) {
    try {
      const result = await client.sendPushNotificationsAsync(chunk)
      tickets.push(...result)
    } catch (err) {
      console.error('[expo-push] chunk send failed', err)
      Sentry.captureException(err, { tags: { area: 'expo_push_send' } })
    }
  }

  let successCount = 0
  let failureCount = 0

  tickets.forEach((ticket, i) => {
    if (ticket.status === 'ok') {
      successCount += 1
      return
    }
    failureCount += 1
    const errorType = ticket.details?.error
    if (
      errorType === 'DeviceNotRegistered' ||
      errorType === 'InvalidCredentials'
    ) {
      const tok = validPairs[i]?.t
      if (tok) invalidTokens.push(tok)
    }
  })

  return { successCount, failureCount, invalidTokens }
}
