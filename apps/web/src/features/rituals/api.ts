import { api } from '@/shared/lib/api-client'

export type RitualKind =
  | 'DAILY_PLAN'
  | 'DAILY_SHUTDOWN'
  | 'WEEKLY_PLAN'
  | 'WEEKLY_REVIEW'
  | 'QUARTERLY_REVIEW'
  | 'ANNUAL_REVIEW'
  | 'CUSTOM'

export type RitualStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

export interface RitualStep {
  type: 'PROMPT' | 'CONFIRM_TASKS' | 'PLAN_DAY' | string
  key?: string
  text?: string
}

export interface Ritual {
  id: string
  userId: string | null
  kind: RitualKind
  name: string
  cadence: string
  scheduledTime: string | null
  steps: RitualStep[]
  isEnabled: boolean
}

export interface ReflectionEntry {
  id: string
  ritualInstanceId: string
  promptKey: string
  body: string
  attachedGoalId: string | null
  createdAt: string
}

export interface RitualInstance {
  id: string
  ritualId: string
  userId: string
  scheduledFor: string
  startedAt: string | null
  completedAt: string | null
  status: RitualStatus
  snapshot: unknown
  ritual: Ritual
  reflections: ReflectionEntry[]
}

export type RitualCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND'

export interface RitualCreateInput {
  kind: RitualKind
  name: string
  cadence: RitualCadence
  scheduledTime?: string
  steps: RitualStep[]
  isEnabled?: boolean
}

export const ritualsApi = {
  list: () => api.get<{ data: Ritual[] }>('/rituals').then((r) => r.data.data),

  create: (input: RitualCreateInput) =>
    api.post<{ data: Ritual }>('/rituals', input).then((r) => r.data.data),

  update: (id: string, input: Partial<RitualCreateInput>) =>
    api.patch<{ data: Ritual }>(`/rituals/${id}`, input).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/rituals/${id}`).then((r) => r.data),

  today: () =>
    api
      .get<{ data: { pending: RitualInstance[]; plan: RitualInstance; shutdown: RitualInstance } }>('/rituals/today')
      .then((r) => r.data.data),

  week: () =>
    api
      .get<{ data: { pending: RitualInstance[]; plan: RitualInstance; review: RitualInstance } }>('/rituals/week')
      .then((r) => r.data.data),

  updateInstance: (
    id: string,
    body: { status?: RitualStatus; startedAt?: string; completedAt?: string; snapshot?: unknown },
  ) => api.patch<{ data: RitualInstance }>(`/rituals/instances/${id}`, body).then((r) => r.data.data),

  addReflection: (body: { ritualInstanceId: string; promptKey: string; body: string; attachedGoalId?: string }) =>
    api.post<{ data: ReflectionEntry }>('/rituals/reflections', body).then((r) => r.data.data),

  suggestWeeklyObjectives: (instanceId?: string) =>
    api
      .post<{ data: { objectives: string[]; rationale: string } }>(
        '/rituals/ai/suggest-weekly-objectives',
        instanceId ? { instanceId } : {},
      )
      .then((r) => r.data.data),

  aiSummary: (instanceId: string) =>
    api
      .post<{
        data: {
          summary: string
          highlights: string[]
          blockers: string[]
          suggestedNextFocus: string
          alignmentPct: number
          totalCompleted: number
        }
      }>(`/rituals/instances/${instanceId}/ai-summary`, {})
      .then((r) => r.data.data),
}
