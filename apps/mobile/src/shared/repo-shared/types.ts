import type { FeatureKey } from './constants';

export interface FeatureValue {
  enabled: boolean;
  limit?: number;
  reason?: string;
  value?: unknown;
}

export type ResolvedFeatureSet = Record<FeatureKey, FeatureValue>;

export type FeaturesResponse = {
  resolvedAt: string;
  data: ResolvedFeatureSet;
};
