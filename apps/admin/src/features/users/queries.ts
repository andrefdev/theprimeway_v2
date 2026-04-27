import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import {
  getUsers,
  getAllUsers,
  getUser,
  getUserSubscription,
  getUserFeatureOverrides,
  setFeatureOverride,
  deleteFeatureOverride,
  getPlans,
  updateUserSubscription,
} from './api'
import { queryClient } from '@/lib/query-client'
import type { FeatureKey } from '@repo/shared/constants'

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => [...usersQueryKeys.all, 'list', page, limit] as const,
  listAll: () => [...usersQueryKeys.all, 'list', 'all'] as const,
  detail: (userId: string) => [...usersQueryKeys.all, 'detail', userId] as const,
  subscription: (userId: string) => [...usersQueryKeys.all, 'subscription', userId] as const,
  features: (userId: string) => [...usersQueryKeys.all, 'features', userId] as const,
}

export const usersQueries = {
  list: (page = 1, limit = 20) =>
    queryOptions({
      queryKey: usersQueryKeys.list(page, limit),
      queryFn: () => getUsers(page, limit),
    }),

  detail: (userId: string) =>
    queryOptions({
      queryKey: usersQueryKeys.detail(userId),
      queryFn: () => getUser(userId),
    }),

  subscription: (userId: string) =>
    queryOptions({
      queryKey: usersQueryKeys.subscription(userId),
      queryFn: () => getUserSubscription(userId),
    }),

  features: (userId: string) =>
    queryOptions({
      queryKey: usersQueryKeys.features(userId),
      queryFn: () => getUserFeatureOverrides(userId),
    }),
}

/**
 * Hook to get a single page of users (server-paginated).
 */
export function useUsers(page = 1, limit = 20) {
  return useQuery(usersQueries.list(page, limit))
}

/**
 * Hook to get ALL users (auto-paginates). Use when client-side
 * search / sort / filter must cover the full set.
 */
export function useAllUsers() {
  return useQuery(
    queryOptions({
      queryKey: usersQueryKeys.listAll(),
      queryFn: getAllUsers,
    }),
  )
}

/**
 * Hook to get single user details
 */
export function useUser(userId: string) {
  return useQuery(usersQueries.detail(userId))
}

/**
 * Hook to get user subscription
 */
export function useUserSubscription(userId: string) {
  return useQuery(usersQueries.subscription(userId))
}

/**
 * Hook to get user feature overrides
 */
export function useUserFeatures(userId: string) {
  return useQuery(usersQueries.features(userId))
}

/**
 * Mutation to set feature override
 */
export function useSetFeatureOverride() {
  return useMutation({
    mutationFn: ({
      userId,
      featureKey,
      enabled,
      reason,
    }: {
      userId: string
      featureKey: FeatureKey
      enabled: boolean
      reason?: string
    }) => setFeatureOverride(userId, featureKey, enabled, reason),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.features(userId),
      })
    },
  })
}

export function usePlans() {
  return useQuery(
    queryOptions({
      queryKey: ['admin', 'plans'] as const,
      queryFn: getPlans,
    }),
  )
}

export function useUpdateUserSubscription() {
  return useMutation({
    mutationFn: ({
      userId,
      planId,
      status,
      endsAt,
      reason,
    }: {
      userId: string
      planId: string | null
      status?: string
      endsAt?: string | null
      reason?: string
    }) => updateUserSubscription(userId, { planId, status, endsAt, reason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.subscription(userId) })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] })
    },
  })
}

/**
 * Mutation to delete feature override
 */
export function useDeleteFeatureOverride() {
  return useMutation({
    mutationFn: ({ userId, featureKey }: { userId: string; featureKey: FeatureKey }) =>
      deleteFeatureOverride(userId, featureKey),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.features(userId),
      })
    },
  })
}
