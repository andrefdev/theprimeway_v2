import { create } from 'zustand'

export interface OverlayState {
  isExpanded: boolean
  isListening: boolean
  lastCommand: string | null
  quickCaptureOpen: boolean
  focusMode: boolean

  setExpanded: (expanded: boolean) => void
  setListening: (listening: boolean) => void
  setLastCommand: (command: string | null) => void
  setQuickCaptureOpen: (open: boolean) => void
  toggleFocusMode: () => void
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isExpanded: false,
  isListening: false,
  lastCommand: null,
  quickCaptureOpen: false,
  focusMode: false,

  setExpanded: (expanded) => set({ isExpanded: expanded }),
  setListening: (listening) => set({ isListening: listening }),
  setLastCommand: (command) => set({ lastCommand: command }),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
}))
