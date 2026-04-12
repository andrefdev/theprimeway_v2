export interface FinanceAccount {
  id: string
  userId: string
  name: string
  type: string
  bankName: string | null
  currency: string
  initialBalance: number
  currentBalance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  accountId: string
  type: string
  category: string
  amount: number
  currency: string
  description: string | null
  date: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  name: string
  category: string
  totalAmount: number
  currency: string
  period: string
  startDate: string
  endDate: string | null
  isActive: boolean
}
