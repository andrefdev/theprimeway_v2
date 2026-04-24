import { prisma } from '../lib/prisma'

class CommandsRepository {
  async findRecent(userId: string, limit: number) {
    return prisma.command.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.command.findFirst({ where: { id, userId } })
  }
}

export const commandsRepo = new CommandsRepository()
