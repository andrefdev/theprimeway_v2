import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@shared/stores/authStore';
import { useFeaturesStore } from '@shared/stores/featuresStore';
import {
  accountDeletionService,
  type RequestDeletionPayload,
} from '../services/accountDeletionService';

export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: (payload: RequestDeletionPayload) => accountDeletionService.request(payload),
  });
}

export function useConfirmAccountDeletion() {
  const queryClient = useQueryClient();
  const clearFeatures = useFeaturesStore((s) => s.clearFeatures);

  return useMutation({
    mutationFn: (code: string) => accountDeletionService.confirm(code),
    onSuccess: async () => {
      // Clear all auth + persisted state. We don't call logout(); the JWT still
      // works cryptographically but the user no longer exists, so any /logout
      // request would 401 noise. Just nuke local state.
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
      await clearFeatures();
      queryClient.clear();
    },
  });
}
