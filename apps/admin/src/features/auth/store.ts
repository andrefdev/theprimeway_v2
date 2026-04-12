import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: { id: string; email: string; role: string } | null
  isLoading: boolean
  error: string | null
  setAuth: (token: string, user: { id: string; email: string; role: string }) => void
  logout: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,
      setAuth: (token, user) =>
        set({
          token,
          user,
          error: null,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          error: null,
        }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'admin-auth',
    },
  ),
)
