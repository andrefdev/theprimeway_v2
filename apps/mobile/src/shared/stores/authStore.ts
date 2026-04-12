import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@shared/types/models';
import { AUTH } from '@shared/api/endpoints';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (provider: string, accessToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    console.log('[AUTH] Login request:', {
      url: `${API_BASE_URL}${AUTH.LOGIN}`,
      body: { email: credentials.email, password: '***' },
    });
    try {
      const { data } = await axios.post<AuthResponse>(
        `${API_BASE_URL}${AUTH.LOGIN}`,
        credentials
      );
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      set({ token: data.token, user: data.user, isAuthenticated: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[AUTH] Login failed:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  loginWithOAuth: async (provider, accessToken) => {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}${AUTH.OAUTH}`,
      { provider, accessToken }
    );
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    if (data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (data) => {
    const { data: response } = await axios.post<AuthResponse>(
      `${API_BASE_URL}${AUTH.REGISTER}`,
      data
    );
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    }
    set({ token: response.token, user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    const token = get().token;
    try {
      if (token) {
        await axios.delete(`${API_BASE_URL}${AUTH.LOGOUT}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Silently fail — we're logging out anyway
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  refreshToken: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        await get().logout();
        return;
      }
      const { data } = await axios.post<AuthResponse>(
        `${API_BASE_URL}${AUTH.REFRESH}`,
        { refreshToken },
        { timeout: 8000 }
      );
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      set({ token: data.token, user: data.user, isAuthenticated: true });
    } catch {
      await get().logout();
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await axios.get<{ user: User }>(
        `${API_BASE_URL}${AUTH.ME}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        }
      );
      set({ token, user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token expired, invalid, or network unreachable — try refresh
      try {
        await get().refreshToken();
      } catch {
        // Clear invalid tokens so user goes to login
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        set({ token: null, user: null, isAuthenticated: false });
      }
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
