import { chatRepo } from '../repositories/chat.repo'

// ---------------------------------------------------------------------------
// Rate limiter (simple in-memory)
// ---------------------------------------------------------------------------
const rateLimit = new Map<string, { count: number; lastReset: number }>()
let lastCleanup = Date.now()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 15
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanupRateLimit() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, value] of Array.from(rateLimit.entries())) {
    if (now - value.lastReset > RATE_LIMIT_WINDOW * 2) {
      rateLimit.delete(key)
    }
  }
}

class ChatService {
  checkRateLimit(userId: string): boolean {
    cleanupRateLimit()
    const now = Date.now()
    const userLimit = rateLimit.get(userId) || { count: 0, lastReset: now }

    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
      userLimit.count = 0
      userLimit.lastReset = now
    }

    if (userLimit.count >= MAX_REQUESTS) {
      return false
    }

    userLimit.count++
    rateLimit.set(userId, userLimit)
    return true
  }

  async checkAiDataSharing(userId: string): Promise<boolean> {
    const userSettings = await chatRepo.findUserSettings(userId)
    return userSettings?.aiDataSharing ?? true
  }

  async chat(
    _userId: string,
    body: { messages?: unknown[]; model?: string; locale?: string },
  ) {
    // Simplified: return a placeholder response
    return {
      error: 'Chat streaming not yet implemented in Hono API. Use the PWA endpoint for now.',
      _meta: {
        model: body.model || 'gpt-4o',
        locale: body.locale || 'es',
        messageCount: Array.isArray(body.messages) ? body.messages.length : 0,
      },
    }
  }

  async getBriefing(userId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [tasks, habits, habitLogs, transactions] = await Promise.all([
      chatRepo.findOpenTasks(userId, 10),
      chatRepo.findActiveHabits(userId),
      chatRepo.findHabitLogsByDate(userId, todayStart, todayEnd),
      chatRepo.findPendingTransactions(userId, 10),
    ])

    const completedToday = habitLogs.filter((l) => (l.completedCount ?? 0) > 0).length

    return {
      briefing: null,
      stats: {
        tasksToday: tasks.length,
        habitsCompleted: completedToday,
        totalHabits: habits.length,
        pendingTransactions: transactions.length,
      },
      _note: 'AI-generated briefing text requires OpenAI integration. Stats are live.',
    }
  }

  async getFinanceInsight(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [transactions, budgets, savingsGoals] = await Promise.all([
      chatRepo.findRecentTransactions(userId, thirtyDaysAgo, 50),
      chatRepo.findActiveBudgets(userId),
      chatRepo.findActiveSavingsGoals(userId),
    ])

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)

    return {
      insight: null,
      totalExpenses,
      totalIncome,
      activeBudgets: budgets.length,
      activeSavingsGoals: savingsGoals.length,
      _note: 'AI-generated insight text requires OpenAI integration. Financial stats are live.',
    }
  }
}

export const chatService = new ChatService()
