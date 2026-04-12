import { apiClient } from '@shared/api/client';
import { KYC } from '@shared/api/endpoints';

export interface KycData {
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType?: string;
}

export interface KycStatus {
  status: 'pending' | 'approved' | 'rejected' | 'not_started';
  submittedAt?: string;
}

export const kycService = {
  getStatus: async () => {
    const { data } = await apiClient.get<KycStatus>(KYC.BASE);
    return data;
  },

  submit: async (kycData: KycData) => {
    const { data } = await apiClient.post(KYC.BASE, kycData);
    return data;
  },
};
