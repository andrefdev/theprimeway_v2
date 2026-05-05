import { prisma } from '../lib/prisma'

export interface PersistedToolCall {
  toolCallId: string
  toolName: string
  args: unknown
  result?: unknown
}

class ChatRepository {
  async findUserSettings(userId: string) {
    return prisma.userSettings.findUnique({
      where: { userId },
      select: { aiDataSharing: true },
    })
  }

  async findOpenTasks(userId: string, limit: number) {
    return prisma.task.findMany({
      where: { userId, status: 'open' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }


  async findActiveHabits(userId: string) {
    const tasks = await prisma.task.findMany({
      where: { userId, kind: 'HABIT', archivedAt: null },
    })
    return tasks.map((t: any) => {
      const m = (t.habitMeta ?? {}) as any
      return {
        id: t.id,
        name: t.title,
        description: t.description,
        targetFrequency: typeof m.targetFrequency === 'number' ? m.targetFrequency : 1,
        frequencyType: m.frequencyType ?? null,
        isActive: true,
      }
    })
  }

  async findHabitLogsByDate(userId: string, gte: Date, lte: Date) {
    return prisma.habitLog.findMany({
      where: { userId, date: { gte, lte } },
    })
  }

  async findActiveGoalsByUser(userId: string) {
    return prisma.goal.findMany({
      where: { userId, horizon: 'QUARTER', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ───────────────────────── Chat threads ─────────────────────────

  async createThread(userId: string) {
    return prisma.chatThread.create({
      data: { userId, lastMessageAt: new Date() },
    })
  }

  async findThreadById(userId: string, threadId: string) {
    return prisma.chatThread.findFirst({
      where: { id: threadId, userId },
    })
  }

  async findThreads(userId: string) {
    return prisma.chatThread.findMany({
      where: { userId },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        lastMessageAt: true,
        createdAt: true,
      },
    })
  }

  async findThreadWithMessages(userId: string, threadId: string) {
    const thread = await prisma.chatThread.findFirst({
      where: { id: threadId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    return thread
  }

  async appendMessage(
    threadId: string,
    payload: {
      role: 'user' | 'assistant'
      content: string
      toolCalls?: PersistedToolCall[]
      model?: string
    },
  ) {
    const hasToolCalls = !!(payload.toolCalls && payload.toolCalls.length > 0)
    return prisma.chatMessage.create({
      data: {
        threadId,
        role: payload.role,
        content: payload.content,
        model: payload.model ?? null,
        toolName: hasToolCalls ? payload.toolCalls![0]!.toolName : null,
        ...(hasToolCalls ? { toolCalls: payload.toolCalls as any } : {}),
      },
    })
  }

  async touchThread(threadId: string) {
    return prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    })
  }

  async renameThread(userId: string, threadId: string, title: string) {
    const result = await prisma.chatThread.updateMany({
      where: { id: threadId, userId },
      data: { title },
    })
    return result.count > 0
  }

  async deleteThread(userId: string, threadId: string) {
    const result = await prisma.chatThread.deleteMany({
      where: { id: threadId, userId },
    })
    return result.count > 0
  }

  async deleteAllThreads(userId: string) {
    const result = await prisma.chatThread.deleteMany({
      where: { userId },
    })
    return result.count
  }

  async getFirstUserAndAssistantMessages(threadId: string) {
    const [user, assistant] = await Promise.all([
      prisma.chatMessage.findFirst({
        where: { threadId, role: 'user' },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.chatMessage.findFirst({
        where: { threadId, role: 'assistant' },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    return { user, assistant }
  }
}

export const chatRepo = new ChatRepository()
