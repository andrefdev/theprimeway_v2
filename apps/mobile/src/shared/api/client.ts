import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AUTH } from '@shared/api/endpoints';
import { getAuthToken, logoutAuthSession, setAuthTokens } from './authSession';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_KEY = 'auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  for (const pending of failedQueue) {
    if (error) pending.reject(error);
    else pending.resolve(token!);
  }
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/oauth')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(
        `${API_BASE_URL}${AUTH.REFRESH}`,
        { refreshToken },
        { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
      );

      const newToken = data.token;
      const newRefresh = data.refreshToken ?? refreshToken;
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      if (newRefresh) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefresh);
      setAuthTokens(newToken, newRefresh);

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await logoutAuthSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
