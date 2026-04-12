import { apiClient } from '@shared/api/client';
import { USER } from '@shared/api/endpoints';

export interface OnboardingStatus {
  currentStep: number;
  completedSteps: string[];
  isCompleted: boolean;
}

export const onboardingService = {
  getStatus: async () => {
    const { data } = await apiClient.get<OnboardingStatus>(USER.ONBOARDING);
    return data;
  },

  updateStep: async (step: string) => {
    const { data } = await apiClient.patch(USER.ONBOARDING, { step });
    return data;
  },
};
