import { api } from '@/shared/lib/api-client'

export interface ApiKey {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export interface ApiKeyCreated {
  id: string
  name: string
  prefix: string
  createdAt: string
  plaintext: string
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  lastDeliveryAt: string | null
  lastDeliveryCode: number | null
  createdAt: string
  updatedAt: string
}

export const integrationsApi = {
  listApiKeys: () => api.get<{ data: ApiKey[] }>('/api-keys').then((r) => r.data.data),
  createApiKey: (name: string) =>
    api.post<{ data: ApiKeyCreated }>('/api-keys', { name }).then((r) => r.data.data),
  revokeApiKey: (id: string) => api.delete(`/api-keys/${id}`).then((r) => r.data),

  listWebhooks: () => api.get<{ data: Webhook[] }>('/webhooks').then((r) => r.data.data),
  listEvents: () => api.get<{ data: string[] }>('/webhooks/events').then((r) => r.data.data),
  createWebhook: (input: { url: string; events: string[]; isActive?: boolean }) =>
    api.post<{ data: Webhook }>('/webhooks', input).then((r) => r.data.data),
  updateWebhook: (id: string, input: Partial<{ url: string; events: string[]; isActive: boolean }>) =>
    api.patch<{ data: Webhook }>(`/webhooks/${id}`, input).then((r) => r.data.data),
  deleteWebhook: (id: string) => api.delete(`/webhooks/${id}`).then((r) => r.data),
}
