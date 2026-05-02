import { prisma } from '../lib/prisma'

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function randomSuffix(len = 4): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12)
}

export async function generateReferralCode(fullName: string): Promise<string> {
  const first = fullName.trim().split(/\s+/)[0] || 'amb'
  const base = slugify(first) || 'amb'

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = randomSuffix(attempt < 2 ? 4 : 5)
    const code = `${base}-${suffix}`
    const existing = await prisma.ambassador.findUnique({ where: { referralCode: code }, select: { id: true } })
    if (!existing) return code
  }
  throw new Error('Could not generate unique referral code')
}
