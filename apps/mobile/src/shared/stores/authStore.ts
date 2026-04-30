import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@shared/types/models';
import { AUTH } from '@shared/api/endpoints';
import { apiClient } from '@shared/api/client';

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
  setTokens: (token: string, refreshToken?: string | null) => void;
}

let loadStoredAuthPromise: Promise<void> | null = null;

async function persistAuth(token: string, refreshToken?: string | null) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    try {
      const { data } = await apiClient.post<AuthResponse>(AUTH.LOGIN, credentials);
      await persistAuth(data.token, data.refreshToken);
      set({ token: data.token, user: data.user, isAuthenticated: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
        console.warn('[AUTH] Login failed', { status });
        throw new Error(message);
      }
      throw error;
    }
  },

  loginWithOAuth: async (provider, accessToken) => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.OAUTH, {
      provider,
      accessToken,
    });
    await persistAuth(data.token, data.refreshToken);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (payload) => {
    const { data } = await apiClient.post<AuthResponse>(AUTH.REGISTER, payload);
    await persistAuth(data.token, data.refreshToken);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    const token = get().token;
    try {
      if (token) {
        await apiClient.delete(AUTH.LOGOUT);
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
      // Use raw axios to bypass interceptor and avoid recursion
      const { data } = await axios.post<AuthResponse>(
        `${process.env.EXPO_PUBLIC_API_URL}${AUTH.REFRESH}`,
        { refreshToken },
        { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
      );
      await persistAuth(data.token, data.refreshToken);
      set({
        token: data.token,
        user: data.user ?? get().user,
        isAuthenticated: true,
      });
    } catch {
      await get().logout();
    }
  },

  loadStoredAuth: async () => {
    if (loadStoredAuthPromise) return loadStoredAuthPromise;
    loadStoredAuthPromise = (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          set({ isLoading: false });
          return;
        }
        // Hydrate token first so apiClient interceptor can attach it
        set({ token });
        try {
          const { data } = await apiClient.get<{ user: User }>(AUTH.ME, {
            timeout: 8000,
          });
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch {
          // 401 will have been handled by interceptor (refresh attempt or logout)
          // If still unauthenticated, ensure cleanup
          if (!get().isAuthenticated) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            set({ token: null, user: null, isAuthenticated: false });
          }
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      } finally {
        loadStoredAuthPromise = null;
      }
    })();
    return loadStoredAuthPromise;
  },

  setUser: (user) => set({ user }),
  setTokens: (token, _refreshToken) => set({ token, isAuthenticated: true }),
}));
