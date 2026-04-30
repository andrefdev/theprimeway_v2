import { api } from '@/shared/lib/api-client'

export interface WorkingHoursRow {
  id: string
  channelId: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface WorkingHoursInput {
  channelId?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export const workingHoursApi = {
  list: (channelId?: string | null) => {
    const suffix = channelId ? `?channelId=${encodeURIComponent(channelId)}` : ''
    return api
      .get<{ data: WorkingHoursRow[] }>(`/working-hours${suffix}`)
      .then((r) => r.data.data)
  },

  bulkReplace: (rows: WorkingHoursInput[], channelId?: string | null) => {
    const suffix = channelId ? `?channelId=${encodeURIComponent(channelId)}` : ''
    return api
      .put<{ data: { ok: boolean; count: number } }>(`/working-hours${suffix}`, rows)
      .then((r) => r.data.data)
  },
}
