import { api } from '../../lib/api-client'

export interface ProfileUpdateRequest {
  name: string
}

export interface ProfileUpdateResponse {
  name: string
}

export const profileApi = {
  updateProfile: (payload: ProfileUpdateRequest) =>
    api.patch<{ data: ProfileUpdateResponse }>('/user/profile', payload),
}
