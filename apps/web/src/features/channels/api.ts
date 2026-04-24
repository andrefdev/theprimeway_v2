import { api } from '@/shared/lib/api-client'

export interface Channel {
  id: string
  userId: string
  contextId: string
  name: string
  color: string
  isDefault: boolean
  isEnabled: boolean
  importFromCalendarId: string | null
  timeboxToCalendarId: string | null
  slackChannelId: string | null
  asanaProjectId: string | null
  createdAt: string
  updatedAt: string
  context?: { id: string; name: string; color: string; isPersonal: boolean }
}

export interface Context {
  id: string
  userId: string
  name: string
  color: string
  isPersonal: boolean
  position: number
  createdAt: string
  updatedAt: string
  channels?: Channel[]
}

export interface ContextInput {
  name: string
  color?: string
  isPersonal?: boolean
  position?: number
}

export interface ChannelInput {
  contextId: string
  name: string
  color?: string
  isDefault?: boolean
  isEnabled?: boolean
  importFromCalendarId?: string | null
  timeboxToCalendarId?: string | null
}

export const channelsApi = {
  listContexts: () => api.get<{ data: Context[] }>('/channels/contexts').then((r) => r.data.data),
  createContext: (body: ContextInput) => api.post<{ data: Context }>('/channels/contexts', body).then((r) => r.data.data),
  updateContext: (id: string, body: Partial<ContextInput>) =>
    api.patch<{ data: Context }>(`/channels/contexts/${id}`, body).then((r) => r.data.data),
  deleteContext: (id: string) => api.delete(`/channels/contexts/${id}`).then((r) => r.data),

  list: () => api.get<{ data: Channel[] }>('/channels').then((r) => r.data.data),
  create: (body: ChannelInput) => api.post<{ data: Channel }>('/channels', body).then((r) => r.data.data),
  update: (id: string, body: Partial<ChannelInput>) =>
    api.patch<{ data: Channel }>(`/channels/${id}`, body).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/channels/${id}`).then((r) => r.data),

  seedDefaults: () => api.post<{ data: unknown }>('/channels/seed-defaults', {}).then((r) => r.data),
}
