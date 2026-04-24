import { api } from '@/shared/lib/api-client'

export interface FatigueSignal {
  windowDays: number
  totalCompleted: number
  lowPriorityCompleted: number
  highPriorityCompleted: number
  goalUnlinkedCompleted: number
  lowPriorityRatio: number
  goalUnlinkedRatio: number
  level: 'clear' | 'mild' | 'strong'
  message: string
}

export const fatigueApi = {
  get: (windowDays = 7) =>
    api.get<{ data: FatigueSignal }>('/fatigue', { params: { windowDays } }).then((r) => r.data.data),
}
