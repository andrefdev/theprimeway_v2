export type VoiceCommand =
  | { type: 'ADD_TASK'; title: string; priority?: 'low' | 'medium' | 'high' }
  | { type: 'START_POMODORO'; taskTitle?: string }
  | { type: 'LOG_HABIT'; habitName: string }
  | { type: 'OPEN_ROUTE'; route: string }
  | { type: 'UNKNOWN'; raw: string }

const PATTERNS: Array<{
  regex: RegExp
  handler: (m: RegExpMatchArray) => VoiceCommand
}> = [
  {
    regex: /^(?:add|create|new)\s+task\s+(.+)$/i,
    handler: (m) => ({ type: 'ADD_TASK', title: (m[1] ?? '').trim() }),
  },
  {
    regex: /^start\s+(?:a\s+)?pomodoro(?:\s+for\s+(.+))?$/i,
    handler: (m) => ({ type: 'START_POMODORO', taskTitle: m[1]?.trim() }),
  },
  {
    regex: /^(?:log|complete|done)\s+(?:habit\s+)?(.+)$/i,
    handler: (m) => ({ type: 'LOG_HABIT', habitName: (m[1] ?? '').trim() }),
  },
  {
    regex: /^(?:open|go\s+to|navigate\s+to)\s+(.+)$/i,
    handler: (m) => ({
      type: 'OPEN_ROUTE',
      route: (m[1] ?? '').toLowerCase().replace(/\s+/g, ''),
    }),
  },
]

export function parseVoiceCommand(text: string): VoiceCommand {
  const trimmed = text.trim()

  for (const { regex, handler } of PATTERNS) {
    const match = trimmed.match(regex)
    if (match) {
      return handler(match)
    }
  }

  return { type: 'UNKNOWN', raw: trimmed }
}
