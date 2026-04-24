import { prisma } from '../lib/prisma'

class ApiKeysRepository {
  list(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    })
  }

  create(userId: string, data: { name: string; prefix: string; hashedKey: string }) {
    return prisma.apiKey.create({ data: { userId, ...data } })
  }

  findByPrefix(prefix: string) {
    return prisma.apiKey.findUnique({ where: { prefix } })
  }

  markUsed(id: string) {
    return prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } })
  }

  async revoke(id: string, userId: string): Promise<boolean> {
    const r = await prisma.apiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return r.count > 0
  }
}

export const apiKeysRepo = new ApiKeysRepository()
