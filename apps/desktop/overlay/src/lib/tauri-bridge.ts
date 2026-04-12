import { invoke } from '@tauri-apps/api/core'
import { listen, emit } from '@tauri-apps/api/event'

export async function showOverlay(): Promise<void> {
  return invoke('show_overlay')
}

export async function hideOverlay(): Promise<void> {
  return invoke('hide_overlay')
}

export async function resizeOverlay(width: number, height: number): Promise<void> {
  return invoke('resize_overlay', { width, height })
}

export async function snapOverlayToCorner(corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): Promise<void> {
  return invoke('snap_overlay_to_corner', { corner })
}

export function listenToVoiceActivate(callback: () => void) {
  return listen('voice-activate', callback)
}

export function emitVoiceCommand(command: unknown) {
  return emit('voice-command-received', command)
}
