import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const KEY_PREFIX = 'pk_live_'

export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const random = randomBytes(24).toString('base64url')
  const plaintext = `${KEY_PREFIX}${random}`
  const prefix = plaintext.slice(0, 12)
  const hash = hashApiKey(plaintext)
  return { plaintext, prefix, hash }
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

export function isApiKey(candidate: string): boolean {
  return candidate.startsWith(KEY_PREFIX)
}

export function hashesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}
