import { useAuthStore } from '@shared/stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, register, loginWithOAuth } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    loginWithOAuth,
  };
}
