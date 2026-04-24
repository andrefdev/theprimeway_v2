import { prisma } from '../lib/prisma'

export interface SubtaskCreate {
  title: string
  plannedTimeMinutes?: number
  position?: number
}

class SubtasksRepository {
  listByTask(taskId: string) {
    return prisma.subtask.findMany({ where: { taskId }, orderBy: { position: 'asc' } })
  }

  async findLastPosition(taskId: string): Promise<number> {
    const last = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    return last?.position ?? 0
  }

  async taskOwnedBy(taskId: string, userId: string): Promise<boolean> {
    const t = await prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } })
    return !!t
  }

  create(taskId: string, data: SubtaskCreate & { position: number }) {
    return prisma.subtask.create({ data: { taskId, ...data } })
  }

  async findByIdForUser(id: string, userId: string) {
    return prisma.subtask.findFirst({
      where: { id, task: { userId } },
    })
  }

  async update(id: string, userId: string, data: Partial<{ title: string; isCompleted: boolean; plannedTimeMinutes: number | null; actualTimeMinutes: number; position: number }>) {
    const found = await this.findByIdForUser(id, userId)
    if (!found) return null
    return prisma.subtask.update({ where: { id }, data })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const found = await this.findByIdForUser(id, userId)
    if (!found) return false
    await prisma.subtask.delete({ where: { id } })
    return true
  }
}

export const subtasksRepo = new SubtasksRepository()
