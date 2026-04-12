import { apiClient } from '@shared/api/client';
import { FINANCES } from '@shared/api/endpoints';
import type { Investment, InvestmentSummary } from '@shared/types/models';

export interface InvestmentFormData {
  name: string;
  ticker?: string;
  investmentType:
    | 'stocks'
    | 'bonds'
    | 'etf'
    | 'crypto'
    | 'real_estate'
    | 'mutual_fund'
    | 'other';
  platform?: string;
  currency: string;
  units?: number;
  purchasePrice?: number;
  currentPrice?: number;
  totalInvested: number;
  currentValue: number;
  purchaseDate?: string;
  notes?: string;
  isActive?: boolean;
}

export const investmentsService = {
  // ── List ──────────────────────────────────────────────────
  getInvestments: async (): Promise<Investment[]> => {
    const { data } = await apiClient.get<{ data: Investment[] }>(FINANCES.INVESTMENTS);
    return data.data ?? [];
  },

  // ── Single ────────────────────────────────────────────────
  getInvestmentById: async (id: string): Promise<Investment> => {
    const { data } = await apiClient.get<{ data: Investment }>(FINANCES.INVESTMENT_BY_ID(id));
    return data.data;
  },

  // ── Summary ───────────────────────────────────────────────
  getInvestmentsSummary: async (): Promise<InvestmentSummary> => {
    const { data } = await apiClient.get<{ data: InvestmentSummary }>(
      FINANCES.INVESTMENTS_SUMMARY,
    );
    return data.data;
  },

  // ── Create ────────────────────────────────────────────────
  createInvestment: async (investmentData: InvestmentFormData): Promise<Investment> => {
    const { data } = await apiClient.post<{ data: Investment }>(
      FINANCES.INVESTMENTS,
      investmentData,
    );
    return data.data;
  },

  // ── Update ────────────────────────────────────────────────
  updateInvestment: async (
    id: string,
    investmentData: Partial<InvestmentFormData>,
  ): Promise<Investment> => {
    const { data } = await apiClient.put<{ data: Investment }>(
      FINANCES.INVESTMENT_BY_ID(id),
      investmentData,
    );
    return data.data;
  },

  // ── Delete ────────────────────────────────────────────────
  deleteInvestment: async (id: string): Promise<void> => {
    await apiClient.delete(FINANCES.INVESTMENT_BY_ID(id));
  },
};
