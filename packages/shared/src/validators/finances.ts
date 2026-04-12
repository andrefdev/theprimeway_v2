import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash', 'other']),
  currency: z.string().default('USD'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  initialBalance: z.number().default(0),
  creditLimit: z.number().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  transferToAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const createBudgetSchema = z.object({
  name: z.string().min(1),
  periodType: z.string().optional(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalAmount: z.number().optional(),
  amount: z.number().optional(),
  categoryType: z.string().optional().default('expense'),
  currency: z.string().optional(),
  variability: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateBudgetSchema = createBudgetSchema.partial()

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().min(0),
  currentAmount: z.number().default(0),
  currency: z.string().default('USD'),
  deadline: z.string().optional(),
  accountId: z.string().optional(),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial()

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateBudgetInput = z.input<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>
