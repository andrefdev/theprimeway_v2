import { PrismaClient } from '@prisma/client'
import { Pool as PgPool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const createPrismaClient = () => {
  const pool = new PgPool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const isProduction = process.env.NODE_ENV === 'production'

  return new PrismaClient({
    adapter,
    log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
