/**
 * Per-user advisory lock for scheduling operations.
 *
 * Why: auto-schedule reads gaps then writes sessions. Without a lock, two
 * concurrent requests from the same user can both read the same "free" slot
 * and both write a session there — `deconflict` would clean it up post-hoc,
 * but the right place to prevent it is at the read→write boundary itself.
 *
 * How: Postgres `pg_advisory_xact_lock(bigint)` — request-scoped mutex keyed
 * by a hash of the userId. Two requests with the same key serialize; auto-
 * released when the surrounding transaction ends. Independent users don't
 * block each other.
 */
import { createHash } from 'node:crypto'
import { prisma } from '../../lib/prisma'

/** Hash a UUID-ish userId to a signed 64-bit int suitable for pg_advisory_xact_lock. */
function userIdToLockId(userId: string): bigint {
  const buf = createHash('sha1').update(userId).digest()
  return buf.readBigInt64BE(0)
}

/**
 * Run `fn` while holding the per-user advisory lock. The lock lives for the
 * duration of the wrapper transaction; `fn` itself runs against the global
 * Prisma client (separate connection) and may open its own nested transactions
 * — typical of session-write paths that already use `prisma.$transaction(...)`.
 */
export async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const lockId = userIdToLockId(userId)
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId}::bigint)`
      return fn()
    },
    { timeout: 30_000 },
  )
}
