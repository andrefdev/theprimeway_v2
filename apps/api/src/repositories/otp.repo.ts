/**
 * OTP Repository — Prisma data access for EmailOtp
 */
import { prisma } from '../lib/prisma'

export type OtpPurpose = 'register' | 'reset' | 'delete'

class OtpRepository {
  async invalidateExisting(email: string, purpose: OtpPurpose) {
    await prisma.emailOtp.updateMany({
      where: { email, purpose, consumed: false },
      data: { consumed: true },
    })
  }

  async create(data: { email: string; purpose: OtpPurpose; codeHash: string; expiresAt: Date }) {
    return prisma.emailOtp.create({ data })
  }

  async findLatestActive(email: string, purpose: OtpPurpose) {
    return prisma.emailOtp.findFirst({
      where: { email, purpose, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async incrementAttempts(id: string) {
    return prisma.emailOtp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    })
  }

  async markConsumed(id: string) {
    return prisma.emailOtp.update({
      where: { id },
      data: { consumed: true },
    })
  }

  async countRecent(email: string, purpose: OtpPurpose, sinceMs: number) {
    return prisma.emailOtp.count({
      where: { email, purpose, createdAt: { gt: new Date(Date.now() - sinceMs) } },
    })
  }
}

export const otpRepository = new OtpRepository()
