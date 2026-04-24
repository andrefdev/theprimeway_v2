import { prisma } from '../lib/prisma'

export interface VisionUpsert {
  statement: string
  coreValues: string[]
  identityStatements: string[]
}

class VisionRepository {
  findByUser(userId: string) {
    return prisma.vision.findUnique({ where: { userId } })
  }

  upsert(userId: string, data: VisionUpsert) {
    return prisma.vision.upsert({
      where: { userId },
      update: { ...data, lastReviewedAt: new Date() },
      create: { userId, ...data, lastReviewedAt: new Date() },
    })
  }

  async deleteByUser(userId: string) {
    await prisma.vision.deleteMany({ where: { userId } })
  }

  findTaskGoalLinks(taskId: string, userId: string) {
    return prisma.taskGoal.findMany({
      where: { taskId, task: { userId } },
      include: { goal: true },
    })
  }

  findGoalById(id: string) {
    return prisma.goal.findUnique({ where: { id } })
  }
}

export const visionRepo = new VisionRepository()
