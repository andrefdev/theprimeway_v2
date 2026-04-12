import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@shared/stores/authStore';
import { useFeaturesStore } from '@shared/stores/featuresStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const loadStoredFeatures = useFeaturesStore((s) => s.loadStoredFeatures);

  useEffect(() => {
    loadStoredAuth();
    loadStoredFeatures();
  }, [loadStoredAuth, loadStoredFeatures]);

  return <>{children}</>;
}
