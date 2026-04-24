import { prisma } from '../lib/prisma'

export interface WorkingHoursInput {
  channelId?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

class WorkingHoursRepository {
  async findMany(userId: string, channelFilter: string | null | 'null') {
    const where: any = { userId }
    if (channelFilter === 'null') where.channelId = null
    else if (channelFilter) where.channelId = channelFilter
    return prisma.workingHours.findMany({ where, orderBy: [{ dayOfWeek: 'asc' }] })
  }

  async create(userId: string, data: WorkingHoursInput) {
    return prisma.workingHours.create({ data: { userId, ...data } })
  }

  async updateByIdAndUser(id: string, userId: string, data: Partial<WorkingHoursInput>) {
    const r = await prisma.workingHours.updateMany({ where: { id, userId }, data })
    if (r.count === 0) return null
    return prisma.workingHours.findUnique({ where: { id } })
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const r = await prisma.workingHours.deleteMany({ where: { id, userId } })
    return r.count > 0
  }

  async bulkReplace(userId: string, channelFilter: string | null | 'null', rows: WorkingHoursInput[]) {
    const channelId = channelFilter === 'null' ? null : channelFilter ?? null
    await prisma.$transaction([
      prisma.workingHours.deleteMany({ where: { userId, channelId } }),
      prisma.workingHours.createMany({ data: rows.map((r) => ({ userId, ...r })) }),
    ])
    return rows.length
  }

  async seedDefaults(userId: string) {
    const existing = await prisma.workingHours.count({ where: { userId, channelId: null } })
    if (existing > 0) return 0
    const rows = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      userId,
      channelId: null,
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
    }))
    await prisma.workingHours.createMany({ data: rows })
    return rows.length
  }
}

export const workingHoursRepo = new WorkingHoursRepository()
