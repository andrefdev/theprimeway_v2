import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from './api'

export const integrationsKeys = {
  apiKeys: ['integrations', 'api-keys'] as const,
  webhooks: ['integrations', 'webhooks'] as const,
  events: ['integrations', 'events'] as const,
}

export function useApiKeys() {
  return useQuery({ queryKey: integrationsKeys.apiKeys, queryFn: integrationsApi.listApiKeys })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => integrationsApi.createApiKey(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.apiKeys }),
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsApi.revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.apiKeys }),
  })
}

export function useWebhooks() {
  return useQuery({ queryKey: integrationsKeys.webhooks, queryFn: integrationsApi.listWebhooks })
}

export function useWebhookEvents() {
  return useQuery({ queryKey: integrationsKeys.events, queryFn: integrationsApi.listEvents, staleTime: Infinity })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.createWebhook,
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.webhooks }),
  })
}

export function useUpdateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ url: string; events: string[]; isActive: boolean }> }) =>
      integrationsApi.updateWebhook(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.webhooks }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsApi.deleteWebhook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.webhooks }),
  })
}
