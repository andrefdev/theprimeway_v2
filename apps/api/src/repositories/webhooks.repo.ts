import { prisma } from '../lib/prisma'

export interface WebhookCreate {
  url: string
  events: string[]
  secret: string
  isActive?: boolean
}

class WebhooksRepository {
  list(userId: string) {
    return prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  create(userId: string, data: WebhookCreate) {
    return prisma.webhook.create({ data: { userId, ...data } })
  }

  async update(id: string, userId: string, data: Partial<WebhookCreate>) {
    const r = await prisma.webhook.updateMany({ where: { id, userId }, data: { ...data, updatedAt: new Date() } })
    if (r.count === 0) return null
    return prisma.webhook.findUnique({ where: { id } })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const r = await prisma.webhook.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  findActiveForEvent(userId: string, event: string) {
    return prisma.webhook.findMany({
      where: { userId, isActive: true, events: { has: event } },
    })
  }

  recordDelivery(id: string, code: number) {
    return prisma.webhook.update({
      where: { id },
      data: { lastDeliveryAt: new Date(), lastDeliveryCode: code },
    })
  }
}

export const webhooksRepo = new WebhooksRepository()
