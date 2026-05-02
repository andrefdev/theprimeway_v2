export const GOOGLE_EVENT_COLORS: Record<string, string> = {
  '1': '#7986cb', // Lavender
  '2': '#33b679', // Sage
  '3': '#8e24aa', // Grape
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerine
  '7': '#039be5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3f51b5', // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
}

const COLOR_TOKENS: Record<string, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  muted: '#6b7280',
}

export function googleColorIdToHex(id?: string): string | undefined {
  if (!id) return undefined
  return GOOGLE_EVENT_COLORS[id]
}

export function colorTokenToHex(color?: string): string {
  return color ? (COLOR_TOKENS[color] ?? '#6b7280') : '#6b7280'
}

export function resolveItemColor(item: { colorId?: string; color?: string }): string {
  return googleColorIdToHex(item.colorId) ?? colorTokenToHex(item.color)
}

export function withAlpha(hex: string, alpha = '26'): string {
  return hex + alpha
}
