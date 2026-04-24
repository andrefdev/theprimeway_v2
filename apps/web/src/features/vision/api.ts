import { api } from '@/shared/lib/api-client'

export interface Vision {
  id: string
  statement: string
  coreValues: string[]
  identityStatements: string[]
  lastReviewedAt: string | null
}

export interface VisionThread {
  vision: Vision | null
  chains: Array<Array<{ id: string; horizon: string; title: string }>>
}

export const visionApi = {
  get: () => api.get<{ data: Vision | null }>('/vision').then((r) => r.data),

  upsert: (body: { statement: string; coreValues: string[]; identityStatements: string[] }) =>
    api.put<{ data: Vision }>('/vision', body).then((r) => r.data),

  thread: (taskId: string) =>
    api.get<{ data: VisionThread }>(`/vision/thread/${taskId}`).then((r) => r.data),
}
