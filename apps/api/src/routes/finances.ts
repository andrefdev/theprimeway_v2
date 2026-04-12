/**
 * Finances Routes — HTTP layer (thin controller)
 *
 * Responsibilities:
 * - Parse HTTP request (query params, body, path params)
 * - Call service methods
 * - Format and return HTTP response
 * - NO Prisma queries, NO business logic
 */
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types/env'
import { FEATURES } from '@repo/shared/constants'
import { authMiddleware } from '../middleware/auth'
import { requireFeature } from '../middleware/feature-gate'
import { financesService } from '../services/finances.service'
import { parsePaginationLimit } from '../lib/utils'

export const financesRoutes = new OpenAPIHono<AppEnv>()
financesRoutes.use('*', authMiddleware)
financesRoutes.use('*', requireFeature(FEATURES.FINANCES_MODULE))

// ─── Shared ──────────────────────────────────────────────────────────────────

const errorResponse = z.object({ error: z.string() })
const genericData = z.any()

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/accounts
const listAccountsRoute = createRoute({
  method: 'get',
  path: '/accounts',
  tags: ['Finances - Accounts'],
  summary: 'List finance accounts',
  security: [{ Bearer: [] }],
  request: { query: z.object({ isActive: z.enum(['true', 'false']).optional() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Accounts list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(listAccountsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const data = await financesService.listAccounts(userId, {
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    })
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[ACCOUNTS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /finances/accounts
const createAccountBody = z.object({
  name: z.string().min(1),
  type: z.string(),
  currency: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  initialBalance: z.number().optional(),
  creditLimit: z.number().optional(),
})

const createAccountRoute = createRoute({
  method: 'post',
  path: '/accounts',
  tags: ['Finances - Accounts'],
  summary: 'Create a finance account',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createAccountBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Account created' },
    400: { content: { 'application/json': { schema: errorResponse } }, description: 'Validation error' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(createAccountRoute, async (c) => {
  const { userId } = c.get('user')
  const body = c.req.valid('json')

  try {
    const data = await financesService.createAccount(userId, body)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[ACCOUNTS_POST]', error)
    if (error instanceof Error && (error.message.includes('Maximum') || error.message.includes('cannot exceed'))) {
      return c.json({ error: error.message }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /finances/accounts/:id
const getAccountRoute = createRoute({
  method: 'get',
  path: '/accounts/:id',
  tags: ['Finances - Accounts'],
  summary: 'Get a finance account by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Account found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(getAccountRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const data = await financesService.getAccount(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[ACCOUNT_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /finances/accounts/:id
const updateAccountBody = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  creditLimit: z.number().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

const updateAccountRoute = createRoute({
  method: 'patch',
  path: '/accounts/:id',
  tags: ['Finances - Accounts'],
  summary: 'Update a finance account',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateAccountBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Account updated' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(updateAccountRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.updateAccount(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[ACCOUNT_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /finances/accounts/:id
const deleteAccountRoute = createRoute({
  method: 'delete',
  path: '/accounts/:id',
  tags: ['Finances - Accounts'],
  summary: 'Delete a finance account',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Account deleted' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(deleteAccountRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    await financesService.deleteAccount(userId, id)
    return c.body(null, 204)
  } catch (error) {
    console.error('[ACCOUNT_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/transactions
const listTransactionsRoute = createRoute({
  method: 'get',
  path: '/transactions',
  tags: ['Finances - Transactions'],
  summary: 'List transactions',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      accountId: z.string().optional(),
      budgetId: z.string().optional(),
      debtId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData), count: z.number() }) } }, description: 'Transactions list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(listTransactionsRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const result = await financesService.listTransactions(userId, {
      page: parseInt(q.page || '1'),
      limit: parsePaginationLimit(q.limit, 20),
      accountId: q.accountId,
      budgetId: q.budgetId,
      debtId: q.debtId,
      startDate: q.startDate,
      endDate: q.endDate,
      type: q.type,
      status: q.status,
      search: q.search,
      sortBy: q.sortBy || 'date',
      sortOrder: q.sortOrder || 'desc',
    })
    return c.json(result, 200)
  } catch (error) {
    console.error('[TRANSACTIONS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /finances/transactions
const createTransactionBody = z.object({
  amount: z.number(),
  description: z.string().optional(),
  type: z.string(),
  date: z.string().optional(),
  accountId: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  incomeSourceId: z.string().optional(),
  recurringExpenseId: z.string().optional(),
  transferAccountId: z.string().optional(),
  budgetId: z.string().optional(),
  debtId: z.string().optional(),
  receiptUrl: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.number().optional(),
  isManualRate: z.boolean().optional(),
  isCleared: z.boolean().optional(),
}).passthrough()

const createTransactionRoute = createRoute({
  method: 'post',
  path: '/transactions',
  tags: ['Finances - Transactions'],
  summary: 'Create a transaction',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createTransactionBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Transaction created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(createTransactionRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.createTransaction(userId, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[TRANSACTIONS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /finances/transactions/:id
const getTransactionRoute = createRoute({
  method: 'get',
  path: '/transactions/:id',
  tags: ['Finances - Transactions'],
  summary: 'Get a transaction by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Transaction found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(getTransactionRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const data = await financesService.getTransaction(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[TRANSACTION_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /finances/transactions/:id
const updateTransactionBody = createTransactionBody.partial()

const updateTransactionRoute = createRoute({
  method: 'patch',
  path: '/transactions/:id',
  tags: ['Finances - Transactions'],
  summary: 'Update a transaction',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateTransactionBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Transaction updated' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(updateTransactionRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.updateTransaction(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[TRANSACTION_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /finances/transactions/:id
const deleteTransactionRoute = createRoute({
  method: 'delete',
  path: '/transactions/:id',
  tags: ['Finances - Transactions'],
  summary: 'Delete a transaction',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Transaction deleted' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(deleteTransactionRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    await financesService.deleteTransaction(userId, id)
    return c.body(null, 204)
  } catch (error) {
    console.error('[TRANSACTION_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/budgets
const listBudgetsRoute = createRoute({
  method: 'get',
  path: '/budgets',
  tags: ['Finances - Budgets'],
  summary: 'List budgets',
  security: [{ Bearer: [] }],
  request: { query: z.object({ period: z.string().optional() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Budgets list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(listBudgetsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const data = await financesService.listBudgets(userId, { period: q.period })
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[BUDGETS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /finances/budgets
const createBudgetBody = z.object({
  name: z.string().min(1),
  totalAmount: z.number().optional(),
  amount: z.number().optional(),
  periodType: z.string().optional(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryType: z.string().optional(),
  currency: z.string().optional(),
  variability: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

const createBudgetRoute = createRoute({
  method: 'post',
  path: '/budgets',
  tags: ['Finances - Budgets'],
  summary: 'Create a budget',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createBudgetBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Budget created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(createBudgetRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.createBudget(userId, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[BUDGETS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /finances/budgets/:id
const getBudgetRoute = createRoute({
  method: 'get',
  path: '/budgets/:id',
  tags: ['Finances - Budgets'],
  summary: 'Get a budget by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Budget found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(getBudgetRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const data = await financesService.getBudget(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[BUDGET_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /finances/budgets/:id
const updateBudgetBody = createBudgetBody.partial()

const updateBudgetRoute = createRoute({
  method: 'patch',
  path: '/budgets/:id',
  tags: ['Finances - Budgets'],
  summary: 'Update a budget',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateBudgetBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Budget updated' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(updateBudgetRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.updateBudget(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[BUDGET_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /finances/budgets/:id
const deleteBudgetRoute = createRoute({
  method: 'delete',
  path: '/budgets/:id',
  tags: ['Finances - Budgets'],
  summary: 'Delete a budget',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: 'Budget deleted' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(deleteBudgetRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    await financesService.deleteBudget(userId, id)
    return c.body(null, 204)
  } catch (error) {
    console.error('[BUDGET_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// DEBTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/debts
const listDebtsRoute = createRoute({
  method: 'get',
  path: '/debts',
  tags: ['Finances - Debts'],
  summary: 'List debts',
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      debtType: z.string().optional(),
      isActive: z.enum(['true', 'false']).optional(),
    }),
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Debts list' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(listDebtsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const data = await financesService.listDebts(userId, {
      debtType: q.debtType,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    })
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[DEBTS_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}) as any)

// POST /finances/debts
const createDebtBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  totalAmount: z.number(),
  paidAmount: z.number().optional(),
  currency: z.string().optional(),
  creditor: z.string().optional(),
  dueDate: z.string().optional(),
  interestRate: z.number().optional(),
  isActive: z.boolean().optional(),
  paymentDay: z.number().optional(),
  installmentAmount: z.number().optional(),
  installmentCount: z.number().optional(),
  nextPaymentDate: z.string().optional(),
  debtType: z.string().optional(),
}).passthrough()

const createDebtRoute = createRoute({
  method: 'post',
  path: '/debts',
  tags: ['Finances - Debts'],
  summary: 'Create a debt',
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createDebtBody } } } },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Debt created' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(createDebtRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.createDebt(userId, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[DEBTS_POST]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /finances/debts/:id
const getDebtRoute = createRoute({
  method: 'get',
  path: '/debts/:id',
  tags: ['Finances - Debts'],
  summary: 'Get a debt by ID',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Debt found' },
    404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(getDebtRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    const data = await financesService.getDebt(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[DEBT_GET]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PATCH /finances/debts/:id
const updateDebtBody = createDebtBody.partial()

const updateDebtRoute = createRoute({
  method: 'patch',
  path: '/debts/:id',
  tags: ['Finances - Debts'],
  summary: 'Update a debt',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateDebtBody } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Debt updated' },
    500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' },
  },
})

financesRoutes.openapi(updateDebtRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>

  try {
    const data = await financesService.updateDebt(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) {
    console.error('[DEBT_PATCH]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// DELETE /finances/debts/:id
const deleteDebtRoute = createRoute({
  method: 'delete',
  path: '/debts/:id',
  tags: ['Finances - Debts'],
  summary: 'Delete a debt',
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Debt deleted' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(deleteDebtRoute, async (c) => {
  const { userId } = c.get('user')
  const { id } = c.req.valid('param')

  try {
    await financesService.deleteDebt(userId, id)
    return c.body(null, 204)
  } catch (error) {
    console.error('[DEBT_DELETE]', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// SAVINGS GOALS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/savings-goals
const listSavingsGoalsRoute = createRoute({
  method: 'get', path: '/savings-goals', tags: ['Finances - Savings Goals'],
  summary: 'List savings goals', security: [{ Bearer: [] }],
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Savings goals list' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(listSavingsGoalsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  try {
    const data = await financesService.listSavingsGoals(userId)
    return c.json({ data }, 200)
  } catch (error) { console.error('[SAVINGS_GOALS_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
}) as any)

// POST /finances/savings-goals
const createSavingsGoalBody = z.object({
  name: z.string().min(1), targetAmount: z.number(), currentAmount: z.number().optional(),
  currency: z.string().optional(), targetDate: z.string().optional(), accountId: z.string().optional(),
}).passthrough()

const createSavingsGoalRoute = createRoute({
  method: 'post', path: '/savings-goals', tags: ['Finances - Savings Goals'],
  summary: 'Create a savings goal', security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createSavingsGoalBody } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Savings goal created' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(createSavingsGoalRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.createSavingsGoal(userId, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[SAVINGS_GOALS_POST]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// GET /finances/savings-goals/:id
const getSavingsGoalRoute = createRoute({
  method: 'get', path: '/savings-goals/:id', tags: ['Finances - Savings Goals'],
  summary: 'Get a savings goal by ID', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Savings goal found' }, 404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(getSavingsGoalRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try {
    const data = await financesService.getSavingsGoal(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) { console.error('[SAVINGS_GOAL_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// PATCH /finances/savings-goals/:id
const updateSavingsGoalRoute = createRoute({
  method: 'patch', path: '/savings-goals/:id', tags: ['Finances - Savings Goals'],
  summary: 'Update a savings goal', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: createSavingsGoalBody.partial() } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Savings goal updated' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(updateSavingsGoalRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.updateSavingsGoal(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[SAVINGS_GOAL_PATCH]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// DELETE /finances/savings-goals/:id
const deleteSavingsGoalRoute = createRoute({
  method: 'delete', path: '/savings-goals/:id', tags: ['Finances - Savings Goals'],
  summary: 'Delete a savings goal', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Savings goal deleted' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(deleteSavingsGoalRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try { await financesService.deleteSavingsGoal(userId, id); return c.body(null, 204) }
  catch (error) { console.error('[SAVINGS_GOAL_DELETE]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// INCOME SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/income-sources
const listIncomeSourcesRoute = createRoute({
  method: 'get', path: '/income-sources', tags: ['Finances - Income Sources'],
  summary: 'List income sources', security: [{ Bearer: [] }],
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Income sources list' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(listIncomeSourcesRoute, (async (c: any) => {
  const { userId } = c.get('user')
  try {
    const data = await financesService.listIncomeSources(userId)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INCOME_SOURCES_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
}) as any)

// POST /finances/income-sources
const createIncomeSourceBody = z.object({
  name: z.string().min(1), baseAmount: z.number().optional(), amount: z.number().optional(),
  currency: z.string().optional(), frequency: z.string().optional(), category: z.string().optional(),
  type: z.string().optional(), isVariable: z.boolean().optional(), probability: z.number().optional(),
  estimationStrategy: z.string().optional(), historicalWindowDays: z.number().optional(),
  isActive: z.boolean().optional(), notes: z.string().optional(),
}).passthrough()

const createIncomeSourceRoute = createRoute({
  method: 'post', path: '/income-sources', tags: ['Finances - Income Sources'],
  summary: 'Create an income source', security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createIncomeSourceBody } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Income source created' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(createIncomeSourceRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.createIncomeSource(userId, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INCOME_SOURCES_POST]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// GET /finances/income-sources/:id
const getIncomeSourceRoute = createRoute({
  method: 'get', path: '/income-sources/:id', tags: ['Finances - Income Sources'],
  summary: 'Get an income source by ID', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Income source found' }, 404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(getIncomeSourceRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try {
    const data = await financesService.getIncomeSource(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INCOME_SOURCE_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// PATCH /finances/income-sources/:id
const updateIncomeSourceRoute = createRoute({
  method: 'patch', path: '/income-sources/:id', tags: ['Finances - Income Sources'],
  summary: 'Update an income source', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: createIncomeSourceBody.partial() } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Income source updated' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(updateIncomeSourceRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.updateIncomeSource(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INCOME_SOURCE_PATCH]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// DELETE /finances/income-sources/:id
const deleteIncomeSourceRoute = createRoute({
  method: 'delete', path: '/income-sources/:id', tags: ['Finances - Income Sources'],
  summary: 'Delete an income source', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Income source deleted' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(deleteIncomeSourceRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try { await financesService.deleteIncomeSource(userId, id); return c.body(null, 204) }
  catch (error) { console.error('[INCOME_SOURCE_DELETE]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/investments
const listInvestmentsRoute = createRoute({
  method: 'get', path: '/investments', tags: ['Finances - Investments'],
  summary: 'List investment holdings', security: [{ Bearer: [] }],
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Holdings list' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(listInvestmentsRoute, (async (c: any) => {
  const { userId } = c.get('user')
  try {
    const data = await financesService.listInvestments(userId)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INVESTMENTS_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
}) as any)

// POST /finances/investments
const createInvestmentBody = z.object({
  name: z.string().min(1), ticker: z.string().nullable().optional(), category: z.string().optional(),
  quantity: z.number().optional(), avgCostPrice: z.number().optional(), currentPrice: z.number().optional(),
  currency: z.string().optional(), accountId: z.string().nullable().optional(), notes: z.string().nullable().optional(),
}).passthrough()

const createInvestmentRoute = createRoute({
  method: 'post', path: '/investments', tags: ['Finances - Investments'],
  summary: 'Create an investment holding', security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createInvestmentBody } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Holding created' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(createInvestmentRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.createInvestment(userId, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INVESTMENTS_POST]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// GET /finances/investments/:id
const getInvestmentRoute = createRoute({
  method: 'get', path: '/investments/:id', tags: ['Finances - Investments'],
  summary: 'Get an investment holding by ID', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Holding found' }, 404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(getInvestmentRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try {
    const data = await financesService.getInvestment(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INVESTMENT_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// PATCH /finances/investments/:id
const updateInvestmentRoute = createRoute({
  method: 'patch', path: '/investments/:id', tags: ['Finances - Investments'],
  summary: 'Update an investment holding', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: createInvestmentBody.partial() } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Holding updated' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(updateInvestmentRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.updateInvestment(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[INVESTMENT_PATCH]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// DELETE /finances/investments/:id
const deleteInvestmentRoute = createRoute({
  method: 'delete', path: '/investments/:id', tags: ['Finances - Investments'],
  summary: 'Delete an investment holding', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Holding deleted' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(deleteInvestmentRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try { await financesService.deleteInvestment(userId, id); return c.body(null, 204) }
  catch (error) { console.error('[INVESTMENT_DELETE]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /finances/recurring-expenses
const listRecurringExpensesRoute = createRoute({
  method: 'get', path: '/recurring-expenses', tags: ['Finances - Recurring Expenses'],
  summary: 'List recurring expenses', security: [{ Bearer: [] }],
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: z.array(genericData) }) } }, description: 'Recurring expenses list' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(listRecurringExpensesRoute, (async (c: any) => {
  const { userId } = c.get('user')
  try {
    const data = await financesService.listRecurringExpenses(userId)
    return c.json({ data }, 200)
  } catch (error) { console.error('[RECURRING_EXPENSES_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
}) as any)

// POST /finances/recurring-expenses
const createRecurringExpenseBody = z.object({
  name: z.string().min(1), description: z.string().optional(), type: z.string().optional(),
  category: z.string().optional(), frequency: z.string().optional(),
  baseAmount: z.number().optional(), amount: z.number().optional(), currency: z.string().optional(),
  dueDay: z.number().optional(), isAutoPay: z.boolean().optional(),
  budgetId: z.string().optional(), accountId: z.string().optional(),
  isActive: z.boolean().optional(), notes: z.string().optional(),
}).passthrough()

const createRecurringExpenseRoute = createRoute({
  method: 'post', path: '/recurring-expenses', tags: ['Finances - Recurring Expenses'],
  summary: 'Create a recurring expense', security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createRecurringExpenseBody } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Recurring expense created' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(createRecurringExpenseRoute, async (c) => {
  const { userId } = c.get('user')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.createRecurringExpense(userId, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[RECURRING_EXPENSES_POST]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// GET /finances/recurring-expenses/:id
const getRecurringExpenseRoute = createRoute({
  method: 'get', path: '/recurring-expenses/:id', tags: ['Finances - Recurring Expenses'],
  summary: 'Get a recurring expense by ID', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Recurring expense found' }, 404: { content: { 'application/json': { schema: errorResponse } }, description: 'Not found' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(getRecurringExpenseRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try {
    const data = await financesService.getRecurringExpense(userId, id)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json({ data }, 200)
  } catch (error) { console.error('[RECURRING_EXPENSE_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// PATCH /finances/recurring-expenses/:id
const updateRecurringExpenseRoute = createRoute({
  method: 'patch', path: '/recurring-expenses/:id', tags: ['Finances - Recurring Expenses'],
  summary: 'Update a recurring expense', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: createRecurringExpenseBody.partial() } } } },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Recurring expense updated' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(updateRecurringExpenseRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  const json = c.req.valid('json') as Record<string, unknown>
  try {
    const data = await financesService.updateRecurringExpense(userId, id, json)
    return c.json({ data }, 200)
  } catch (error) { console.error('[RECURRING_EXPENSE_PATCH]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// DELETE /finances/recurring-expenses/:id
const deleteRecurringExpenseRoute = createRoute({
  method: 'delete', path: '/recurring-expenses/:id', tags: ['Finances - Recurring Expenses'],
  summary: 'Delete a recurring expense', security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: { 204: { description: 'Recurring expense deleted' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(deleteRecurringExpenseRoute, async (c) => {
  const { userId } = c.get('user'); const { id } = c.req.valid('param')
  try { await financesService.deleteRecurringExpense(userId, id); return c.body(null, 204) }
  catch (error) { console.error('[RECURRING_EXPENSE_DELETE]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

const statsRoute = createRoute({
  method: 'get', path: '/stats', tags: ['Finances - Stats'],
  summary: 'Get financial stats', security: [{ Bearer: [] }],
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      currency: z.string().optional(),
    }),
  },
  responses: { 200: { content: { 'application/json': { schema: z.object({ data: genericData }) } }, description: 'Financial stats' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(statsRoute, async (c) => {
  const { userId } = c.get('user')
  const q = c.req.valid('query')

  try {
    const data = await financesService.getStats(userId, {
      startDate: q.startDate,
      endDate: q.endDate,
    })
    return c.json({ data }, 200)
  } catch (error) { console.error('[STATS_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// EXCHANGE RATES
// ═══════════════════════════════════════════════════════════════════════════════

const exchangeRatesRoute = createRoute({
  method: 'get', path: '/exchange-rates', tags: ['Finances - Exchange Rates'],
  summary: 'Get exchange rates', security: [{ Bearer: [] }],
  request: { query: z.object({ base: z.string().optional() }) },
  responses: { 200: { content: { 'application/json': { schema: z.array(genericData) } }, description: 'Exchange rates' }, 500: { content: { 'application/json': { schema: errorResponse } }, description: 'Server error' } },
})

financesRoutes.openapi(exchangeRatesRoute, async (c) => {
  try {
    const data = await financesService.getExchangeRates()
    return c.json(data, 200)
  } catch (error) { console.error('[EXCHANGE_RATES_GET]', error); return c.json({ error: 'Internal server error' }, 500) }
})
