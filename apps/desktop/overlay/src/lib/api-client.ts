import axios from 'axios'
import { useOverlayAuthStore } from '../stores/auth.store'

const API_BASE = import.meta.env.PROD
  ? 'https://api.theprimeway.app/api'
  : 'http://localhost:3001/api'

export const overlayApi = axios.create({
  baseURL: API_BASE,
  timeout: 8_000,
})

overlayApi.interceptors.request.use((config) => {
  const { token } = useOverlayAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
