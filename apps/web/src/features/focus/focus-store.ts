import { create } from 'zustand'

interface FocusState {
  taskId: string | null
  open: boolean
  /** Acceptance criterion captured in pre-flight. */
  acceptance: string
  /** Duration override in minutes captured in pre-flight. */
  durationMinutes: number | null

  start: (taskId: string) => void
  close: () => void
  setAcceptance: (value: string) => void
  setDurationMinutes: (value: number | null) => void
}

export const useFocusStore = create<FocusState>((set) => ({
  taskId: null,
  open: false,
  acceptance: '',
  durationMinutes: null,

  start: (taskId) => set({ taskId, open: true, acceptance: '', durationMinutes: null }),
  close: () => set({ taskId: null, open: false, acceptance: '', durationMinutes: null }),
  setAcceptance: (acceptance) => set({ acceptance }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
}))
