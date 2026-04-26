// Default import works with CJS modules in Node ESM (named imports don't)
import PrismaClientPkg from '@prisma/client'
import type { PrismaClient as PrismaClientType } from '@prisma/client'
const { PrismaClient } = PrismaClientPkg
import { Pool as PgPool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType }

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
