/**
 * Finances Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Business rules (budget date defaults, stats aggregation)
 * - NO Prisma queries, NO HTTP concerns
 */
import { financesRepository } from '../repositories/finances.repo'
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfYear, endOfYear,
} from 'date-fns'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class FinancesService {
  // ─── Accounts ───────────────────────────────────────────────────────────────

  async listAccounts(userId: string, opts: { isActive?: boolean }) {
    return financesRepository.findManyAccounts(userId, opts)
  }

  async getAccount(userId: string, id: string) {
    return financesRepository.findAccountById(userId, id)
  }

  async createAccount(userId: string, body: {
    name: string; type: string; currency?: string; bankName?: string;
    accountNumber?: string; initialBalance?: number; creditLimit?: number
  }) {
    return financesRepository.createAccount(userId, {
      name: body.name,
      type: body.type,
      currency: body.currency,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      initialBalance: body.initialBalance,
      creditLimit: body.creditLimit,
    })
  }

  async updateAccount(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    if (json.type) data.type = json.type
    if (json.bankName) data.bankName = json.bankName
    if (json.accountNumber) data.accountNumber = json.accountNumber
    if (json.creditLimit !== undefined) data.creditLimit = json.creditLimit
    if (json.isActive !== undefined) data.isActive = json.isActive

    return financesRepository.updateAccount(userId, id, data)
  }

  async deleteAccount(userId: string, id: string) {
    return financesRepository.deleteAccount(userId, id)
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  async listTransactions(userId: string, opts: {
    page: number; limit: number;
    accountId?: string; budgetId?: string; debtId?: string;
    startDate?: string; endDate?: string;
    type?: string; status?: string; search?: string;
    sortBy: string; sortOrder: string
  }) {
    return financesRepository.findManyTransactions(userId, opts)
  }

  async getTransaction(userId: string, id: string) {
    return financesRepository.findTransactionById(userId, id)
  }

  async createTransaction(userId: string, json: Record<string, unknown>) {
    return financesRepository.createTransaction(userId, json)
  }

  async updateTransaction(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateTransaction(userId, id, json)
  }

  async deleteTransaction(userId: string, id: string) {
    return financesRepository.deleteTransaction(userId, id)
  }

  // ─── Budgets ────────────────────────────────────────────────────────────────

  async listBudgets(userId: string, opts: { period?: string }) {
    return financesRepository.findManyBudgets(userId, opts)
  }

  async getBudget(userId: string, id: string) {
    return financesRepository.findBudgetById(userId, id)
  }

  async createBudget(userId: string, json: Record<string, unknown>) {
    const periodType = (json.periodType || json.period || 'monthly') as string

    let startDate = json.startDate
      ? new Date(json.startDate as string)
      : undefined
    let endDate = json.endDate
      ? new Date(json.endDate as string)
      : undefined

    // Auto-compute period dates when not provided
    if (!startDate || !endDate) {
      const now = new Date()
      if (periodType === 'monthly') { startDate = startOfMonth(now); endDate = endOfMonth(now) }
      else if (periodType === 'weekly') { startDate = startOfWeek(now); endDate = endOfWeek(now) }
      else if (periodType === 'yearly') { startDate = startOfYear(now); endDate = endOfYear(now) }
      else { startDate = startOfMonth(now); endDate = endOfMonth(now) }
    }

    return financesRepository.createBudget(userId, {
      name: json.name as string,
      totalAmount: (json.totalAmount || json.amount || 0) as number,
      periodType,
      startDate,
      endDate,
      categoryType: (json.categoryType || 'expense') as string,
      currency: json.currency as string | undefined,
      variability: json.variability as string | undefined,
      isActive: (json.isActive ?? true) as boolean,
    })
  }

  async updateBudget(userId: string, id: string, json: Record<string, unknown>) {
    const data: Record<string, unknown> = {}
    if (json.name) data.name = json.name
    if (json.description !== undefined) data.description = json.description

    const totalAmount = (json.totalAmount ?? json.amount) as number | undefined
    if (totalAmount !== undefined) data.totalAmount = totalAmount

    const periodType = (json.periodType || json.period) as string | undefined
    if (periodType) data.periodType = periodType

    if (json.startDate) data.startDate = new Date(json.startDate as string)
    if (json.endDate) data.endDate = new Date(json.endDate as string)

    if (json.currency) data.currency = json.currency
    if (json.categoryType) data.categoryType = json.categoryType
    if (json.variability) data.variability = json.variability

    return financesRepository.updateBudget(userId, id, data)
  }

  async deleteBudget(userId: string, id: string) {
    return financesRepository.deleteBudget(userId, id)
  }

  // ─── Debts ──────────────────────────────────────────────────────────────────

  async listDebts(userId: string, opts: { debtType?: string; isActive?: boolean }) {
    return financesRepository.findManyDebts(userId, opts)
  }

  async getDebt(userId: string, id: string) {
    return financesRepository.findDebtById(userId, id)
  }

  async createDebt(userId: string, json: Record<string, unknown>) {
    return financesRepository.createDebt(userId, json)
  }

  async updateDebt(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateDebt(userId, id, json)
  }

  async deleteDebt(userId: string, id: string) {
    return financesRepository.deleteDebt(userId, id)
  }

  // ─── Savings Goals ──────────────────────────────────────────────────────────

  async listSavingsGoals(userId: string) {
    return financesRepository.findManySavingsGoals(userId)
  }

  async getSavingsGoal(userId: string, id: string) {
    return financesRepository.findSavingsGoalById(userId, id)
  }

  async createSavingsGoal(userId: string, json: Record<string, unknown>) {
    return financesRepository.createSavingsGoal(userId, json)
  }

  async updateSavingsGoal(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateSavingsGoal(userId, id, json)
  }

  async deleteSavingsGoal(userId: string, id: string) {
    return financesRepository.deleteSavingsGoal(userId, id)
  }

  // ─── Income Sources ─────────────────────────────────────────────────────────

  async listIncomeSources(userId: string) {
    return financesRepository.findManyIncomeSources(userId)
  }

  async getIncomeSource(userId: string, id: string) {
    return financesRepository.findIncomeSourceById(userId, id)
  }

  async createIncomeSource(userId: string, json: Record<string, unknown>) {
    return financesRepository.createIncomeSource(userId, json)
  }

  async updateIncomeSource(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateIncomeSource(userId, id, json)
  }

  async deleteIncomeSource(userId: string, id: string) {
    return financesRepository.deleteIncomeSource(userId, id)
  }

  // ─── Investments ────────────────────────────────────────────────────────────

  async listInvestments(userId: string) {
    return financesRepository.findManyInvestments(userId)
  }

  async getInvestment(userId: string, id: string) {
    return financesRepository.findInvestmentById(userId, id)
  }

  async createInvestment(userId: string, json: Record<string, unknown>) {
    return financesRepository.createInvestment(userId, json)
  }

  async updateInvestment(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateInvestment(userId, id, json)
  }

  async deleteInvestment(userId: string, id: string) {
    return financesRepository.deleteInvestment(userId, id)
  }

  // ─── Recurring Expenses ─────────────────────────────────────────────────────

  async listRecurringExpenses(userId: string) {
    return financesRepository.findManyRecurringExpenses(userId)
  }

  async getRecurringExpense(userId: string, id: string) {
    return financesRepository.findRecurringExpenseById(userId, id)
  }

  async createRecurringExpense(userId: string, json: Record<string, unknown>) {
    return financesRepository.createRecurringExpense(userId, json)
  }

  async updateRecurringExpense(userId: string, id: string, json: Record<string, unknown>) {
    return financesRepository.updateRecurringExpense(userId, id, json)
  }

  async deleteRecurringExpense(userId: string, id: string) {
    return financesRepository.deleteRecurringExpense(userId, id)
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getStats(userId: string, opts: { startDate?: string; endDate?: string }) {
    const [transactions, accounts] = await Promise.all([
      financesRepository.getTransactionsForStats(userId, opts),
      financesRepository.getActiveAccounts(userId),
    ])

    let totalIncome = 0
    let totalExpense = 0
    for (const tx of transactions) {
      if (tx.type === 'income') totalIncome += Number(tx.amount)
      else if (tx.type === 'expense') totalExpense += Number(tx.amount)
    }

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0)

    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      totalBalance,
      transactionCount: transactions.length,
      accountCount: accounts.length,
    }
  }

  // ─── Exchange Rates ─────────────────────────────────────────────────────────

  async getExchangeRates() {
    return financesRepository.findExchangeRates()
  }
}

export const financesService = new FinancesService()
