import { apiClient } from '@shared/api/client';
import { AUTH } from '@shared/api/endpoints';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@shared/types/models';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.LOGIN, credentials);
    return data;
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.REGISTER, registerData);
    return data;
  },

  loginWithOAuth: async (provider: string, accessToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.OAUTH, { provider, accessToken });
    return data;
  },

  requestOtp: async (email: string): Promise<void> => {
    await apiClient.post(AUTH.REQUEST_OTP, { email });
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.VERIFY_OTP, { email, otp });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ user: User }>(AUTH.ME);
    return data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.delete(AUTH.LOGOUT);
  },
};
