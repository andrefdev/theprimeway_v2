import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

export interface OverlayAuthState {
  token: string | null
  isAuthenticated: boolean
  fetchToken: () => Promise<void>
  clearToken: () => Promise<void>
}

export const useOverlayAuthStore = create<OverlayAuthState>((set) => ({
  token: null,
  isAuthenticated: false,

  fetchToken: async () => {
    try {
      const token = await invoke<string | null>('get_auth_token')
      set({ token, isAuthenticated: !!token })
    } catch (error) {
      console.error('Failed to fetch auth token:', error)
      set({ token: null, isAuthenticated: false })
    }
  },

  clearToken: async () => {
    try {
      await invoke('clear_auth_token')
      set({ token: null, isAuthenticated: false })
    } catch (error) {
      console.error('Failed to clear auth token:', error)
    }
  },
}))
