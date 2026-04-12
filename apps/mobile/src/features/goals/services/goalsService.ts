import { apiClient } from '@shared/api/client';
import { GOALS } from '@shared/api/endpoints';
import type {
  PrimeVision,
  PrimePillar,
  PrimeOutcome,
  PrimeQuarterFocus,
  WeeklyGoal,
} from '@shared/types/models';
import type {
  VisionFormData,
  PillarFormData,
  OutcomeFormData,
  FocusFormData,
  WeeklyGoalFormData,
} from '../types';

// ============================================================
// Health Snapshots
// ============================================================

export interface HealthSnapshot {
  id: string;
  overallScore: number;
  financesScore: number;
  habitsScore: number;
  tasksScore: number;
  goalsScore: number;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

// ============================================================
// Focus Links
// ============================================================

export interface FocusLink {
  id: string;
  title: string;
  status?: string;
}

// ============================================================
// Goals Service
// ============================================================

export const goalsService = {
  // ---- Visions ----
  getVisions: async (): Promise<PrimeVision[]> => {
    const { data } = await apiClient.get<{ data: PrimeVision[] }>(GOALS.VISIONS);
    return data.data ?? [];
  },

  createVision: async (payload: VisionFormData): Promise<PrimeVision> => {
    const { data } = await apiClient.post<{ data: PrimeVision }>(GOALS.VISIONS, payload);
    return data.data;
  },

  updateVision: async (id: string, payload: Partial<VisionFormData>): Promise<PrimeVision> => {
    const { data } = await apiClient.patch<{ data: PrimeVision }>(
      `${GOALS.VISIONS}/${id}`,
      payload
    );
    return data.data;
  },

  deleteVision: async (id: string): Promise<void> => {
    await apiClient.delete(`${GOALS.VISIONS}/${id}`);
  },

  // ---- Pillars ----
  getPillars: async (): Promise<PrimePillar[]> => {
    const { data } = await apiClient.get<{ data: PrimePillar[] }>(GOALS.PILLARS);
    return data.data ?? [];
  },

  createPillar: async (payload: PillarFormData): Promise<PrimePillar> => {
    const { data } = await apiClient.post<{ data: PrimePillar }>(GOALS.PILLARS, payload);
    return data.data;
  },

  // ---- Outcomes ----
  getOutcomes: async (): Promise<PrimeOutcome[]> => {
    const { data } = await apiClient.get<{ data: PrimeOutcome[] }>(GOALS.OUTCOMES);
    return data.data ?? [];
  },

  createOutcome: async (payload: OutcomeFormData): Promise<PrimeOutcome> => {
    const { data } = await apiClient.post<{ data: PrimeOutcome }>(GOALS.OUTCOMES, payload);
    return data.data;
  },

  updateOutcome: async (id: string, payload: Partial<OutcomeFormData>): Promise<PrimeOutcome> => {
    const { data } = await apiClient.patch<{ data: PrimeOutcome }>(
      `${GOALS.OUTCOMES}/${id}`,
      payload
    );
    return data.data;
  },

  // ---- Focuses ----
  getFocuses: async (): Promise<PrimeQuarterFocus[]> => {
    const { data } = await apiClient.get<{ data: PrimeQuarterFocus[] }>(GOALS.FOCUSES);
    return data.data ?? [];
  },

  createFocus: async (payload: FocusFormData): Promise<PrimeQuarterFocus> => {
    const { data } = await apiClient.post<{ data: PrimeQuarterFocus }>(GOALS.FOCUSES, payload);
    return data.data;
  },

  updateFocus: async (
    id: string,
    payload: Partial<FocusFormData>
  ): Promise<PrimeQuarterFocus> => {
    const { data } = await apiClient.patch<{ data: PrimeQuarterFocus }>(
      `${GOALS.FOCUSES}/${id}`,
      payload
    );
    return data.data;
  },

  // ---- Weekly Goals ----
  getWeeklyGoals: async (): Promise<WeeklyGoal[]> => {
    const { data } = await apiClient.get<{ data: WeeklyGoal[] }>(GOALS.WEEKLY);
    return data.data ?? [];
  },

  createWeeklyGoal: async (payload: WeeklyGoalFormData): Promise<WeeklyGoal> => {
    const { data } = await apiClient.post<{ data: WeeklyGoal }>(GOALS.WEEKLY, payload);
    return data.data;
  },

  updateWeeklyGoal: async (
    id: string,
    payload: Partial<WeeklyGoalFormData>
  ): Promise<WeeklyGoal> => {
    const { data } = await apiClient.patch<{ data: WeeklyGoal }>(
      `${GOALS.WEEKLY}/${id}`,
      payload
    );
    return data.data;
  },

  // ---- Health Snapshots ----
  getHealthSnapshots: async (): Promise<HealthSnapshot[]> => {
    const { data } = await apiClient.get<{ data: HealthSnapshot[] }>(
      GOALS.HEALTH_SNAPSHOTS
    );
    return data.data ?? [];
  },

  createHealthSnapshot: async (): Promise<HealthSnapshot> => {
    const { data } = await apiClient.post<{ data: HealthSnapshot }>(GOALS.HEALTH_SNAPSHOTS);
    return data.data;
  },

  // ---- Focus Links ----
  getFocusLinks: async (focusId: string): Promise<{ tasks: FocusLink[]; habits: FocusLink[] }> => {
    const [tasks, habits] = await Promise.all([
      apiClient.get<{ data: FocusLink[] }>(`${GOALS.FOCUS_LINKS_TASKS}?focusId=${focusId}`),
      apiClient.get<{ data: FocusLink[] }>(`${GOALS.FOCUS_LINKS_HABITS}?focusId=${focusId}`),
    ]);
    return { tasks: tasks.data.data ?? [], habits: habits.data.data ?? [] };
  },
};
