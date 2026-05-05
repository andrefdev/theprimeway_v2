import { tool } from 'ai'
import { z } from 'zod'

export function pomodoroClientTools() {
  return {
    startPomodoro: tool({
      description: 'Propose starting a pomodoro focus session. Requires user approval.',
      inputSchema: z.object({
        durationMinutes: z.number().describe('Session length in minutes'),
        taskId: z.string().optional().describe('Optional linked task'),
        taskTitle: z.string().optional().describe('For display'),
      }),
    }),
  }
}
