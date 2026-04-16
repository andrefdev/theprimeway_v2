import { api } from '@/shared/lib/api-client'
import type { Goal, PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal, WeeklyGoal, FocusLink } from '@repo/shared/types'

interface ListResponse<T> {
  data: T[]
  count: number
}

export const goalsApi = {
  // Goals (simple/weekly)
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Goal>>('/goals', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Goal>(`/goals/${id}`).then((r) => r.data),

  create: (data: { title: string; description?: string; deadline?: string; progress?: number; type?: string; status?: string }) =>
    api.post<Goal>('/goals', data).then((r) => r.data),

  update: (id: string, data: Partial<{ title: string; description: string; deadline: string; progress: number; type: string; status: string }>) =>
    api.patch<Goal>(`/goals/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/goals/${id}`).then((r) => r.data),

  // Goal Tree
  getGoalTree: (params?: Record<string, string>) =>
    api.get<PrimeVision[]>('/goals/tree', { params }).then((r) => r.data),

  // Visions
  listVisions: (params?: Record<string, string>) =>
    api.get<ListResponse<PrimeVision>>('/goals/visions', { params }).then((r) => r.data),

  createVision: (data: { title: string; narrative?: string; status?: string }) =>
    api.post<PrimeVision>('/goals/visions', data).then((r) => r.data),

  updateVision: (id: string, data: Partial<{ title: string; narrative: string; status: string }>) =>
    api.patch<PrimeVision>(`/goals/visions/${id}`, data).then((r) => r.data),

  deleteVision: (id: string) =>
    api.delete(`/goals/visions/${id}`).then((r) => r.data),

  // Three Year Goals (formerly Pillars)
  listThreeYearGoals: (params?: Record<string, string>) =>
    api.get<ListResponse<ThreeYearGoal>>('/goals/three-year', { params }).then((r) => r.data),

  createThreeYearGoal: (data: { visionId: string; area: string; title: string; description?: string }) =>
    api.post<ThreeYearGoal>('/goals/three-year', data).then((r) => r.data),

  updateThreeYearGoal: (id: string, data: Partial<{ title: string; area: string; description: string }>) =>
    api.patch<ThreeYearGoal>(`/goals/three-year/${id}`, data).then((r) => r.data),

  deleteThreeYearGoal: (id: string) =>
    api.delete(`/goals/three-year/${id}`).then((r) => r.data),

  // Annual Goals (formerly Outcomes)
  listAnnualGoals: (params?: Record<string, string>) =>
    api.get<ListResponse<AnnualGoal>>('/goals/annual', { params }).then((r) => r.data),

  createAnnualGoal: (data: { threeYearGoalId: string; title: string; description?: string; targetDate?: string }) =>
    api.post<AnnualGoal>('/goals/annual', data).then((r) => r.data),

  updateAnnualGoal: (id: string, data: Partial<{ title: string; description: string; targetDate: string; progress: number }>) =>
    api.patch<AnnualGoal>(`/goals/annual/${id}`, data).then((r) => r.data),

  deleteAnnualGoal: (id: string) =>
    api.delete(`/goals/annual/${id}`).then((r) => r.data),

  // Quarterly Goals (formerly Focuses)
  listQuarterlyGoals: (params?: Record<string, string>) =>
    api.get<ListResponse<QuarterlyGoal>>('/goals/quarterly', { params }).then((r) => r.data),

  createQuarterlyGoal: (data: { annualGoalId: string; year: number; quarter: number; title: string; description?: string; objectives?: any[] }) =>
    api.post<QuarterlyGoal>('/goals/quarterly', data).then((r) => r.data),

  updateQuarterlyGoal: (id: string, data: Partial<{ title: string; description: string; objectives: any[]; progress: number }>) =>
    api.patch<QuarterlyGoal>(`/goals/quarterly/${id}`, data).then((r) => r.data),

  deleteQuarterlyGoal: (id: string) =>
    api.delete(`/goals/quarterly/${id}`).then((r) => r.data),

  // Weekly Goals
  listWeeklyGoals: (params?: Record<string, string>) =>
    api.get<ListResponse<WeeklyGoal>>('/goals/weekly', { params }).then((r) => r.data),

  createWeeklyGoal: (data: { quarterlyGoalId?: string; weekStartDate: string; title: string; description?: string }) =>
    api.post<WeeklyGoal>('/goals/weekly', data).then((r) => r.data),

  updateWeeklyGoal: (id: string, data: Partial<{ title: string; description: string; status: string; order: number }>) =>
    api.patch<WeeklyGoal>(`/goals/weekly/${id}`, data).then((r) => r.data),

  deleteWeeklyGoal: (id: string) =>
    api.delete(`/goals/weekly/${id}`).then((r) => r.data),

  // Focus Links
  listFocusLinks: (quarterlyGoalId: string) =>
    api.get<ListResponse<FocusLink>>(`/goals/focus-links`, { params: { quarterlyGoalId } }).then((r) => r.data),

  createFocusLink: (data: { quarterlyGoalId: string; targetId: string; targetType: string; weight?: number }) =>
    api.post<FocusLink>('/goals/focus-links', data).then((r) => r.data),

  deleteFocusLink: (id: string) =>
    api.delete(`/goals/focus-links/${id}`).then((r) => r.data),

  // AI Features
  suggestSubGoals: (goalId: string, type: 'three-year' | 'annual' | 'quarterly' | 'weekly') =>
    api
      .post<{ data: Array<{ title: string; description: string }> }>('/goals/ai/suggest', {
        goalId,
        type,
      })
      .then((r) => r.data.data),

  getQuarterlyReview: (quarter: 1 | 2 | 3 | 4, year: number) =>
    api
      .get<{
        data: {
          summary: string
          topAchievements: string[]
          stuckAreas: string[]
          proposedFocuses: string[]
        }
      }>('/goals/ai/quarterly-review', { params: { quarter: String(quarter), year: String(year) } })
      .then((r) => r.data.data),

  detectConflicts: () =>
    api.get<{ data: any }>('/goals/ai/conflicts').then((r) => r.data.data),

  detectInactive: (days?: number) =>
    api
      .get<{
        data: {
          inactive: Array<{
            goalId: string
            title: string
            progress: number
            lastActivity: string
            daysSinceActivity: number
            weeklyGoalCount: number
            urgency: 'high' | 'medium' | 'low'
          }>
          count: number
          threshold: number
        }
      }>('/goals/ai/inactive', { params: days ? { days: String(days) } : undefined })
      .then((r) => r.data.data),

  getDashboardSummary: () =>
    api
      .get<{
        data: {
          levels: Record<
            string,
            { total: number; avgProgress: number; health: { green: number; yellow: number; red: number } }
          >
          upcomingDeadlines: Array<{ id: string; title: string; level: string; endDate: string }>
          recentlyCompleted: Array<{ id: string; title: string; level: string }>
        }
      }>('/goals/dashboard-summary')
      .then((r) => r.data.data),

  getTemplates: (category?: string) =>
    api
      .get<{ data: any }>(`/goals/templates${category ? `/${category}` : ''}`)
      .then((r) => r.data.data),
}
