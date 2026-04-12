/**
 * Finances Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries (findMany, create, update, delete)
 * - Returns Prisma objects directly (camelCase)
 * - NO business logic, NO HTTP concerns
 *
 * Sub-domains: Accounts, Transactions, Budgets, Debts, Savings Goals,
 *              Income Sources, Investments, Recurring Expenses,
 *              Exchange Rates, Stats
 */
import { prisma } from '../lib/prisma'

// ═══════════════════════════════════════════════════════════════════════════════
// REPOSITORY
// ═══════════════════════════════════════════════════════════════════════════════

class FinancesRepo {
  // ─── Accounts ───────────────────────────────────────────────────────────────

  async findManyAccounts(userId: string, opts: { isActive?: boolean }) {
    const where: Record<string, unknown> = { userId }
    if (opts.isActive !== undefined) where.isActive = opts.isActive

    return prisma.financeAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAccountById(userId: string, id: string) {
    return prisma.financeAccount.findFirst({ where: { id, userId } })
  }

  async createAccount(userId: string, data: {
    name: string; type: string; currency?: string; bankName?: string;
    accountNumber?: string; initialBalance?: number; creditLimit?: number
  }) {
    return prisma.financeAccount.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        currentBalance: data.initialBalance ?? 0,
        initialBalance: data.initialBalance ?? 0,
        creditLimit: data.creditLimit,
      },
    })
  }

  async updateAccount(userId: string, id: string, data: Record<string, unknown>) {
    return prisma.financeAccount.update({
      where: { id, userId },
      data,
    })
  }

  async deleteAccount(userId: string, id: string) {
    await prisma.financeAccount.delete({ where: { id, userId } })
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  async findManyTransactions(userId: string, opts: {
    page: number; limit: number;
    accountId?: string; budgetId?: string; debtId?: string;
    startDate?: string; endDate?: string;
    type?: string; status?: string; search?: string;
    sortBy: string; sortOrder: string
  }) {
    const where: Record<string, unknown> = { userId }
    if (opts.accountId) where.accountId = opts.accountId
    if (opts.budgetId) where.budgetId = opts.budgetId
    if (opts.debtId) where.debtId = opts.debtId
    if (opts.type) where.type = opts.type
    if (opts.status) where.status = opts.status
    if (opts.search) {
      where.OR = [
        { description: { contains: opts.search, mode: 'insensitive' } },
        { notes: { contains: opts.search, mode: 'insensitive' } },
      ]
    }
    if (opts.startDate || opts.endDate) {
      where.date = {}
      if (opts.startDate) (where.date as Record<string, unknown>).gte = new Date(opts.startDate)
      if (opts.endDate) (where.date as Record<string, unknown>).lte = new Date(opts.endDate)
    }

    const validSortColumns = ['date', 'amount', 'createdAt', 'description']
    let sortBy = opts.sortBy || 'date'
    if (!validSortColumns.includes(sortBy)) sortBy = 'date'

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        take: opts.limit,
        skip: (opts.page - 1) * opts.limit,
        orderBy: { [sortBy]: opts.sortOrder },
        include: { account: true },
      }),
      prisma.transaction.count({ where }),
    ])

    return { data: transactions, count: total }
  }

  async findTransactionById(userId: string, id: string) {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { account: true },
    })
  }

  async createTransaction(userId: string, json: Record<string, unknown>) {
    const date = json.date ? new Date(json.date as string) : new Date()

    return prisma.transaction.create({
      data: {
        userId,
        amount: json.amount as number,
        description: (json.description as string) || '',
        type: json.type as string,
        date,
        accountId: json.accountId as string,
        notes: json.notes as string | undefined,
        tags: (json.tags as string[]) ?? [],
        incomeSourceId: json.incomeSourceId as string | undefined,
        recurringExpenseId: json.recurringExpenseId as string | undefined,
        transferAccountId: json.transferAccountId as string | undefined,
        budgetId: json.budgetId as string | undefined,
        debtId: json.debtId as string | undefined,
        receiptUrl: json.receiptUrl as string | undefined,
        currency: json.currency as string | undefined,
        exchangeRate: json.exchangeRate as number | undefined,
        isManualRate: json.isManualRate as boolean | undefined,
        status: json.isCleared === true ? 'cleared' : 'pending',
      },
      include: { account: true },
    })
  }

  async updateTransaction(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.amount !== undefined) data.amount = json.amount
    if (json.description !== undefined) data.description = json.description
    if (json.type !== undefined) data.type = json.type
    if (json.date !== undefined) data.date = new Date(json.date as string)
    if (json.accountId !== undefined) data.accountId = json.accountId
    if (json.notes !== undefined) data.notes = json.notes
    if (json.tags !== undefined) data.tags = json.tags
    if (json.incomeSourceId !== undefined) data.incomeSourceId = json.incomeSourceId
    if (json.transferAccountId !== undefined) data.transferAccountId = json.transferAccountId
    if (json.budgetId !== undefined) data.budgetId = json.budgetId
    if (json.debtId !== undefined) data.debtId = json.debtId
    if (json.recurringExpenseId !== undefined) data.recurringExpenseId = json.recurringExpenseId
    if (json.currency !== undefined) data.currency = json.currency
    if (json.exchangeRate !== undefined) data.exchangeRate = json.exchangeRate
    if (json.isManualRate !== undefined) data.isManualRate = json.isManualRate
    if (json.receiptUrl !== undefined) data.receiptUrl = json.receiptUrl
    if (json.isCleared !== undefined) data.status = json.isCleared ? 'cleared' : 'pending'

    return prisma.transaction.update({
      where: { id, userId },
      data,
      include: { account: true },
    })
  }

  async deleteTransaction(userId: string, id: string) {
    await prisma.transaction.delete({ where: { id, userId } })
  }

  // ─── Budgets ────────────────────────────────────────────────────────────────

  async findManyBudgets(userId: string, opts: { period?: string }) {
    const where: Record<string, unknown> = { userId }
    if (opts.period) where.periodType = opts.period

    return prisma.budget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { transactions: { select: { amount: true, type: true } } },
    })
  }

  async findBudgetById(userId: string, id: string) {
    return prisma.budget.findFirst({
      where: { id, userId },
      include: { transactions: { select: { amount: true, type: true } } },
    })
  }

  async createBudget(userId: string, data: Record<string, unknown>) {
    return prisma.budget.create({ data: { userId, ...data } as any })
  }

  async updateBudget(userId: string, id: string, data: Record<string, unknown>) {
    return prisma.budget.update({ where: { id, userId }, data })
  }

  async deleteBudget(userId: string, id: string) {
    await prisma.budget.delete({ where: { id, userId } })
  }

  // ─── Debts ──────────────────────────────────────────────────────────────────

  async findManyDebts(userId: string, opts: { debtType?: string; isActive?: boolean }) {
    const where: Record<string, unknown> = { userId }
    if (opts.debtType) where.debtType = opts.debtType
    if (opts.isActive !== undefined) where.isActive = opts.isActive

    return prisma.debt.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async findDebtById(userId: string, id: string) {
    return prisma.debt.findFirst({ where: { id, userId } })
  }

  async createDebt(userId: string, json: Record<string, unknown>) {
    return prisma.debt.create({
      data: {
        userId,
        name: json.name as string,
        description: json.description as string | undefined,
        category: json.category as string | undefined,
        totalAmount: json.totalAmount as number,
        paidAmount: json.paidAmount as number | undefined,
        currency: json.currency as string | undefined,
        creditor: json.creditor as string | undefined,
        dueDate: json.dueDate ? new Date(json.dueDate as string) : undefined,
        interestRate: json.interestRate as number | undefined,
        isActive: (json.isActive ?? true) as boolean,
        paymentDay: json.paymentDay as number | undefined,
        installmentAmount: (json.installmentAmount ?? json.minimumPayment) as number | undefined,
        installmentCount: json.installmentCount as number | undefined,
        nextPaymentDate: json.nextPaymentDate ? new Date(json.nextPaymentDate as string) : undefined,
        debtType: (json.debtType as string) || 'owed',
      },
    })
  }

  async updateDebt(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    if (json.description !== undefined) data.description = json.description
    if (json.category !== undefined) data.category = json.category
    if (json.totalAmount !== undefined) data.totalAmount = json.totalAmount
    if (json.paidAmount !== undefined) data.paidAmount = json.paidAmount
    if (json.currency) data.currency = json.currency
    if (json.creditor !== undefined) data.creditor = json.creditor
    if (json.interestRate !== undefined) data.interestRate = json.interestRate
    if (json.installmentAmount !== undefined) data.installmentAmount = json.installmentAmount
    else if (json.minimumPayment !== undefined) data.installmentAmount = json.minimumPayment
    if (json.dueDate !== undefined) data.dueDate = json.dueDate ? new Date(json.dueDate as string) : null
    if (json.isActive !== undefined) data.isActive = json.isActive
    if (json.paymentDay !== undefined) data.paymentDay = json.paymentDay
    if (json.debtType !== undefined) data.debtType = json.debtType

    return prisma.debt.update({ where: { id, userId }, data })
  }

  async deleteDebt(userId: string, id: string) {
    await prisma.debt.delete({ where: { id, userId } })
  }

  // ─── Savings Goals ──────────────────────────────────────────────────────────

  async findManySavingsGoals(userId: string) {
    return prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  async findSavingsGoalById(userId: string, id: string) {
    return prisma.savingsGoal.findFirst({ where: { id, userId } })
  }

  async createSavingsGoal(userId: string, json: Record<string, unknown>) {
    return prisma.savingsGoal.create({
      data: {
        userId,
        name: json.name as string,
        targetAmount: json.targetAmount as number,
        currentAmount: (json.currentAmount as number) ?? 0,
        currency: json.currency as string | undefined,
        targetDate: json.targetDate ? new Date(json.targetDate as string) : undefined,
        accountId: json.accountId as string | undefined,
      },
    })
  }

  async updateSavingsGoal(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    if (json.targetAmount !== undefined) data.targetAmount = json.targetAmount
    if (json.currentAmount !== undefined) data.currentAmount = json.currentAmount
    if (json.currency) data.currency = json.currency
    if (json.targetDate) data.targetDate = new Date(json.targetDate as string)
    if (json.accountId !== undefined) data.accountId = json.accountId
    if (json.status) data.status = json.status

    return prisma.savingsGoal.update({ where: { id, userId }, data })
  }

  async deleteSavingsGoal(userId: string, id: string) {
    await prisma.savingsGoal.delete({ where: { id, userId } })
  }

  // ─── Income Sources ─────────────────────────────────────────────────────────

  async findManyIncomeSources(userId: string) {
    return prisma.incomeSource.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  async findIncomeSourceById(userId: string, id: string) {
    return prisma.incomeSource.findFirst({ where: { id, userId } })
  }

  async createIncomeSource(userId: string, json: Record<string, unknown>) {
    return prisma.incomeSource.create({
      data: {
        userId,
        name: json.name as string,
        baseAmount: (json.baseAmount as number) ?? (json.amount as number | undefined),
        currency: json.currency as string | undefined,
        frequency: json.frequency as string | undefined,
        category: json.category as string | undefined,
        type: (json.type as string) || (json.isVariable ? 'variable' : 'fixed'),
        probability: json.probability as number | undefined,
        estimationStrategy: json.estimationStrategy as string | undefined,
        historicalWindowDays: json.historicalWindowDays as number | undefined,
        isActive: json.isActive as boolean | undefined,
        notes: json.notes as string | undefined,
      },
    })
  }

  async updateIncomeSource(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    const ba = (json.baseAmount as number | undefined) ?? (json.amount as number | undefined)
    if (ba !== undefined) data.baseAmount = ba
    if (json.currency) data.currency = json.currency
    if (json.frequency) data.frequency = json.frequency
    if (json.category !== undefined) data.category = json.category
    if (json.type) data.type = json.type
    else if (json.isVariable !== undefined) data.type = json.isVariable ? 'variable' : 'fixed'
    if (json.probability !== undefined) data.probability = json.probability
    if (json.estimationStrategy !== undefined) data.estimationStrategy = json.estimationStrategy
    if (json.historicalWindowDays !== undefined) data.historicalWindowDays = json.historicalWindowDays
    if (json.isActive !== undefined) data.isActive = json.isActive
    if (json.notes !== undefined) data.notes = json.notes

    return prisma.incomeSource.update({ where: { id, userId }, data })
  }

  async deleteIncomeSource(userId: string, id: string) {
    await prisma.incomeSource.delete({ where: { id, userId } })
  }

  // ─── Investments ────────────────────────────────────────────────────────────

  async findManyInvestments(userId: string) {
    return prisma.investmentHolding.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  async findInvestmentById(userId: string, id: string) {
    return prisma.investmentHolding.findFirst({ where: { id, userId } })
  }

  async createInvestment(userId: string, json: Record<string, unknown>) {
    return prisma.investmentHolding.create({
      data: {
        userId,
        name: json.name as string,
        ticker: (json.ticker as string) || null,
        category: (json.category as string) || 'stock',
        quantity: (json.quantity as number) ?? 0,
        avgCostPrice: (json.avgCostPrice as number) ?? 0,
        currentPrice: (json.currentPrice as number) ?? 0,
        currency: (json.currency as string) || 'USD',
        accountId: (json.accountId as string) ?? null,
        notes: (json.notes as string) || null,
      },
    })
  }

  async updateInvestment(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name !== undefined) data.name = json.name
    if (json.ticker !== undefined) data.ticker = json.ticker
    if (json.category !== undefined) data.category = json.category
    if (json.quantity !== undefined) data.quantity = json.quantity
    if (json.avgCostPrice !== undefined) data.avgCostPrice = json.avgCostPrice
    if (json.currentPrice !== undefined) data.currentPrice = json.currentPrice
    if (json.currency !== undefined) data.currency = json.currency
    if (json.notes !== undefined) data.notes = json.notes
    if (json.accountId !== undefined) data.accountId = json.accountId

    return prisma.investmentHolding.update({ where: { id, userId }, data })
  }

  async deleteInvestment(userId: string, id: string) {
    await prisma.investmentHolding.delete({ where: { id, userId } })
  }

  // ─── Recurring Expenses ─────────────────────────────────────────────────────

  async findManyRecurringExpenses(userId: string) {
    return prisma.recurringExpense.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  async findRecurringExpenseById(userId: string, id: string) {
    return prisma.recurringExpense.findFirst({ where: { id, userId } })
  }

  async createRecurringExpense(userId: string, json: Record<string, unknown>) {
    return prisma.recurringExpense.create({
      data: {
        userId,
        name: json.name as string,
        description: json.description as string | undefined,
        type: (json.type as string) || 'fixed',
        category: json.category as string | undefined,
        frequency: (json.frequency as string) || 'monthly',
        baseAmount: (json.baseAmount as number) ?? (json.amount as number | undefined),
        currency: json.currency as string | undefined,
        dueDay: json.dueDay as number | undefined,
        isAutoPay: json.isAutoPay as boolean | undefined,
        budgetId: json.budgetId as string | undefined,
        accountId: json.accountId as string | undefined,
        isActive: json.isActive as boolean | undefined,
        notes: json.notes as string | undefined,
      },
    })
  }

  async updateRecurringExpense(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    if (json.description !== undefined) data.description = json.description
    if (json.type) data.type = json.type
    if (json.category !== undefined) data.category = json.category
    if (json.frequency) data.frequency = json.frequency
    const ba = (json.baseAmount as number | undefined) ?? (json.amount as number | undefined)
    if (ba !== undefined) data.baseAmount = ba
    if (json.currency) data.currency = json.currency
    if (json.dueDay !== undefined) data.dueDay = json.dueDay
    if (json.isAutoPay !== undefined) data.isAutoPay = json.isAutoPay
    if (json.budgetId !== undefined) data.budgetId = json.budgetId
    if (json.accountId !== undefined) data.accountId = json.accountId
    if (json.isActive !== undefined) data.isActive = json.isActive
    if (json.notes !== undefined) data.notes = json.notes

    return prisma.recurringExpense.update({ where: { id, userId }, data })
  }

  async deleteRecurringExpense(userId: string, id: string) {
    await prisma.recurringExpense.delete({ where: { id, userId } })
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getTransactionsForStats(userId: string, opts: { startDate?: string; endDate?: string }) {
    const txWhere: Record<string, unknown> = { userId }
    if (opts.startDate || opts.endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (opts.startDate) dateFilter.gte = new Date(opts.startDate)
      if (opts.endDate) dateFilter.lte = new Date(opts.endDate)
      txWhere.date = dateFilter
    }
    return prisma.transaction.findMany({ where: txWhere })
  }

  async getActiveAccounts(userId: string) {
    return prisma.financeAccount.findMany({ where: { userId, isActive: true } })
  }

  // ─── Exchange Rates ─────────────────────────────────────────────────────────

  async findExchangeRates() {
    return prisma.exchangeRate.findMany({
      orderBy: { date: 'desc' },
      distinct: ['fromCurrency', 'toCurrency'],
    })
  }
}

export const financesRepository = new FinancesRepo()
