import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface SendPushInput {
  userIds?: string[]
  title: string
  body: string
  url?: string
  image?: string
  tag?: string
  data?: unknown
}

export interface SendPushResponse {
  total_devices?: number
  success_count: number
  failure_count: number
  message?: string
}

export async function sendPush(input: SendPushInput) {
  const { data } = await api.post<SendPushResponse>('/admin/notifications/push', input)
  return data
}
