/**
 * OTP Service — issue and verify 6-digit one-time codes
 *
 * - 10 min expiry
 * - Max 5 attempts per code
 * - Rate-limit: max 5 issuances per email/purpose per hour
 */
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { otpRepository, type OtpPurpose } from '../repositories/otp.repo'

const EXPIRY_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const RATE_LIMIT_MS = 60 * 60 * 1000
const RATE_LIMIT_COUNT = 5
const SALT_ROUNDS = 8

function generateCode(): string {
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

export const otpService = {
  async issue(email: string, purpose: OtpPurpose): Promise<{ error: string } | { code: string }> {
    const recent = await otpRepository.countRecent(email, purpose, RATE_LIMIT_MS)
    if (recent >= RATE_LIMIT_COUNT) {
      return { error: 'Too many requests. Try again later.' }
    }

    await otpRepository.invalidateExisting(email, purpose)

    const code = generateCode()
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS)
    const expiresAt = new Date(Date.now() + EXPIRY_MS)

    await otpRepository.create({ email, purpose, codeHash, expiresAt })

    return { code }
  },

  async verify(email: string, purpose: OtpPurpose, code: string): Promise<{ error: string } | { ok: true; id: string }> {
    const otp = await otpRepository.findLatestActive(email, purpose)
    if (!otp) return { error: 'Invalid or expired code' }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await otpRepository.markConsumed(otp.id)
      return { error: 'Too many attempts. Request a new code.' }
    }

    const match = await bcrypt.compare(code, otp.codeHash)
    if (!match) {
      await otpRepository.incrementAttempts(otp.id)
      return { error: 'Invalid or expired code' }
    }

    return { ok: true, id: otp.id }
  },

  async consume(id: string) {
    await otpRepository.markConsumed(id)
  },
}
