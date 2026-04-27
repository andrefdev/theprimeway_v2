import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type BillingInterval = 'monthly' | 'yearly' | 'lifetime'

export interface Plan {
  id: string
  name: string
  displayName: string
  description: string | null
  price: number
  currency: string
  billingInterval: BillingInterval
  lemonSqueezyProductId: string | null
  lemonSqueezyVariantId: string | null
  trialPeriodDays: number | null
  maxHabits: number | null
  maxGoals: number | null
  maxTasks: number | null
  maxPomodoroSessionsDaily: number | null
  maxBrainEntries: number | null
  hasAiAssistant: boolean | null
  hasBrainModule: boolean | null
  hasAdvancedAnalytics: boolean | null
  hasCustomThemeCreation: boolean | null
  hasExportData: boolean | null
  hasPrioritySupport: boolean | null
  isActive: boolean | null
  sortOrder: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type PlanInput = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>

export async function listPlans(includeInactive = false): Promise<Plan[]> {
  const { data } = await api.get<{ data: Plan[] }>('/admin/plans', {
    params: { includeInactive: includeInactive ? 'true' : undefined },
  })
  return data.data
}

export async function getPlan(id: string): Promise<Plan> {
  const { data } = await api.get<{ data: Plan }>(`/admin/plans/${id}`)
  return data.data
}

export async function createPlan(input: Partial<PlanInput>): Promise<Plan> {
  const { data } = await api.post<{ data: Plan }>('/admin/plans', input)
  return data.data
}

export async function updatePlan(id: string, input: Partial<PlanInput>): Promise<Plan> {
  const { data } = await api.put<{ data: Plan }>(`/admin/plans/${id}`, input)
  return data.data
}

export async function deletePlan(id: string, hard = false): Promise<void> {
  await api.delete(`/admin/plans/${id}`, { params: { hard: hard ? 'true' : undefined } })
}

/** Get (or auto-create) the global free plan defaults. */
export async function getFreePlan(): Promise<Plan> {
  const { data } = await api.get<{ data: Plan }>('/admin/plans/free')
  return data.data
}
