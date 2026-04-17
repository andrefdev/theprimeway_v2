import axios from 'axios'
import type { FeatureKey, PlanTier } from '@repo/shared/constants'
import { useAuthStore } from '@/features/auth/store'

export type { FeatureKey }

const api = axios.create({
  baseURL: '/api',
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface UserSubscription {
  userId: string
  planTier: PlanTier
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

export interface FeatureOverride {
  userId: string
  featureKey: FeatureKey
  enabled: boolean
  reason?: string
  createdBy?: string
}

/**
 * Get list of users (with pagination)
 */
export async function getUsers(page = 1, limit = 20) {
  const { data } = await api.get('/admin/users', {
    params: { page, limit },
  })
  return data
}

/**
 * Get single user details
 */
export async function getUser(userId: string) {
  const { data } = await api.get(`/admin/users/${userId}`)
  return data as User
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: string) {
  const { data } = await api.get(`/admin/users/${userId}/subscription`)
  return data as UserSubscription
}

/**
 * Get all feature overrides for a user
 */
export async function getUserFeatureOverrides(userId: string) {
  const { data } = await api.get(`/admin/users/${userId}/features`)
  return data as FeatureOverride[]
}

/**
 * Set or update a feature override for a user
 */
export async function setFeatureOverride(
  userId: string,
  featureKey: FeatureKey,
  enabled: boolean,
  reason?: string,
) {
  const { data } = await api.put(`/admin/users/${userId}/features/${featureKey}`, {
    enabled,
    reason,
  })
  return data as FeatureOverride
}

/**
 * Remove a feature override for a user
 */
export async function deleteFeatureOverride(userId: string, featureKey: FeatureKey) {
  await api.delete(`/admin/users/${userId}/features/${featureKey}`)
}

export interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  currency: string
  billingInterval: string
}

export async function getPlans() {
  const { data } = await api.get<{ data: Plan[] }>('/admin/plans')
  return data.data
}

export async function updateUserSubscription(
  userId: string,
  input: { planId: string | null; status?: string; endsAt?: string | null; reason?: string },
) {
  const { data } = await api.put(`/admin/users/${userId}/subscription`, {
    status: 'active',
    ...input,
  })
  return data.data
}
