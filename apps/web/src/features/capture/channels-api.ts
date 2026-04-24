import { api } from '@/shared/lib/api-client'

export interface ChannelSummary {
  id: string
  name: string
  color: string
  contextId: string
  isDefault: boolean
  isEnabled: boolean
}

export const channelsApi = {
  list: () => api.get<{ data: ChannelSummary[] }>('/channels').then((r) => r.data.data),
}
