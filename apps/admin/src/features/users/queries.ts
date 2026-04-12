import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import {
  getUsers,
  getUser,
  getUserSubscription,
  getUserFeatureOverrides,
  setFeatureOverride,
  deleteFeatureOverride,
} from './api'
import { queryClient } from '@/lib/query-client'
import type { FeatureKey } from '@repo/shared/constants'

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => [...usersQueryKeys.all, 'list', page, limit] as const,
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
 * Hook to get list of users
 */
export function useUsers(page = 1, limit = 20) {
  return useQuery(usersQueries.list(page, limit))
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
