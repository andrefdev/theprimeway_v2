import { create } from 'zustand'

export interface OverlayState {
  isExpanded: boolean
  isListening: boolean
  lastCommand: string | null

  setExpanded: (expanded: boolean) => void
  setListening: (listening: boolean) => void
  setLastCommand: (command: string | null) => void
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isExpanded: false,
  isListening: false,
  lastCommand: null,

  setExpanded: (expanded) => set({ isExpanded: expanded }),
  setListening: (listening) => set({ isListening: listening }),
  setLastCommand: (command) => set({ lastCommand: command }),
}))
