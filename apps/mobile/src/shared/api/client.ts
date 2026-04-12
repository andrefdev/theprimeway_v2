import axios from 'axios';
import { useAuthStore } from '@shared/stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Snake_case to camelCase transformer
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key) => {
      acc[toCamelCase(key)] = transformKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// CamelCase to snake_case for requests
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeysToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnake);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key) => {
      acc[toSnakeCase(key)] = transformKeysToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — add JWT + transform request body to snake_case
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Transform request body keys to snake_case
  if (config.data && typeof config.data === 'object') {
    config.data = transformKeysToSnake(config.data);
  }

  return config;
});

// Response interceptor — transform response keys to camelCase + handle 401
apiClient.interceptors.response.use(
  (response) => {
    // Transform response data keys to camelCase
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeys(response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
