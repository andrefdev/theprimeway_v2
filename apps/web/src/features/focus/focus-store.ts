import { create } from 'zustand'

interface FocusState {
  taskId: string | null
  open: boolean

  start: (taskId: string) => void
  close: () => void
}

export const useFocusStore = create<FocusState>((set) => ({
  taskId: null,
  open: false,

  start: (taskId) => set({ taskId, open: true }),
  close: () => set({ taskId: null, open: false }),
}))
