import { prisma } from '../lib/prisma'

export interface ContextCreate {
  name: string
  color?: string
  isPersonal?: boolean
  position?: number
}

export interface ChannelCreate {
  contextId: string
  name: string
  color?: string
  isDefault?: boolean
  isEnabled?: boolean
  importFromCalendarId?: string
  timeboxToCalendarId?: string
  slackChannelId?: string
  asanaProjectId?: string
}

class ChannelsRepository {
  // ── Contexts ─────────────────────────────────────────
  listContexts(userId: string) {
    return prisma.context.findMany({
      where: { userId },
      include: { channels: true },
      orderBy: { position: 'asc' },
    })
  }

  createContext(userId: string, data: ContextCreate) {
    return prisma.context.create({ data: { userId, ...data } })
  }

  async updateContext(id: string, userId: string, data: Partial<ContextCreate>) {
    const r = await prisma.context.updateMany({ where: { id, userId }, data })
    if (r.count === 0) return null
    return prisma.context.findUnique({ where: { id } })
  }

  async deleteContext(id: string, userId: string): Promise<boolean> {
    const r = await prisma.context.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  // ── Channels ─────────────────────────────────────────
  listChannels(userId: string) {
    return prisma.channel.findMany({
      where: { userId },
      include: { context: true },
      orderBy: { name: 'asc' },
    })
  }

  findChannel(id: string, userId: string) {
    return prisma.channel.findFirst({ where: { id, userId } })
  }

  createChannel(userId: string, data: ChannelCreate) {
    return prisma.channel.create({ data: { userId, ...data } })
  }

  async updateChannel(id: string, userId: string, data: Partial<ChannelCreate>) {
    const r = await prisma.channel.updateMany({ where: { id, userId }, data })
    if (r.count === 0) return null
    return prisma.channel.findUnique({ where: { id } })
  }

  async deleteChannel(id: string, userId: string): Promise<boolean> {
    const r = await prisma.channel.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  // ── Seed ─────────────────────────────────────────────
  async seedDefaults(userId: string) {
    const work = await prisma.context.upsert({
      where: { id: `seed-work-${userId}` },
      update: {},
      create: { id: `seed-work-${userId}`, userId, name: 'Work', color: '#3B82F6', isPersonal: false, position: 0 },
    })
    await prisma.context.upsert({
      where: { id: `seed-personal-${userId}` },
      update: {},
      create: { id: `seed-personal-${userId}`, userId, name: 'Personal', color: '#10B981', isPersonal: true, position: 1 },
    })
    await prisma.channel.upsert({
      where: { id: `seed-general-${userId}` },
      update: {},
      create: { id: `seed-general-${userId}`, userId, contextId: work.id, name: 'General', color: '#3B82F6', isDefault: true },
    })
  }
}

export const channelsRepo = new ChannelsRepository()
