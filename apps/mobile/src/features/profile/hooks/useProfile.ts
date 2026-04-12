import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/api/queryKeys';
import { profileService } from '../services/profileService';
import type { UserProfile } from '@shared/types/models';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => profileService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => profileService.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}
