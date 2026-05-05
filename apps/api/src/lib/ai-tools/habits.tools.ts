import { tool } from 'ai'
import { z } from 'zod'
import { prisma } from '../prisma'
import { habitsService } from '../../services/habits.service'
import { startOfLocalDayUtc } from '@repo/shared/utils'

export function habitReadTools(userId: string) {
  return {
    listHabits: tool({
      description: "List the user's active habits",
      inputSchema: z.object({
        includeLogs: z.boolean().optional().describe('Include recent log history'),
      }),
      execute: async ({ includeLogs }) => {
        const { data } = await habitsService.listHabits(userId, {
          isActive: true,
          includeLogs: includeLogs ?? false,
          limit: 50,
          offset: 0,
        } as any)
        return {
          habits: data.map((h: any) => ({
            id: h.id,
            name: h.name,
            frequencyType: h.frequencyType,
            targetFrequency: h.targetFrequency,
            category: h.category,
          })),
        }
      },
    }),
  }
}

export function habitClientTools() {
  return {
    createHabit: tool({
      description: 'Propose creating a new habit. Requires user approval.',
      inputSchema: z.object({
        name: z.string(),
        description: z.string().optional(),
        frequencyType: z.enum(['daily', 'weekly']).optional(),
        targetFrequency: z.number().optional(),
      }),
    }),

    updateHabit: tool({
      description: 'Propose updating an existing habit. Requires user approval.',
      inputSchema: z.object({
        habitId: z.string(),
        habitName: z.string().describe('Current name for display'),
        name: z.string().optional(),
        description: z.string().optional(),
        targetFrequency: z.number().optional(),
        frequencyType: z.enum(['daily', 'weekly']).optional(),
        isActive: z.boolean().optional(),
      }),
    }),

    deleteHabit: tool({
      description: 'Propose deleting a habit. Requires user approval.',
      inputSchema: z.object({
        habitId: z.string(),
        habitName: z.string().describe('For display'),
      }),
    }),

    logHabit: tool({
      description: "Propose logging today's completion for a habit. Requires user approval.",
      inputSchema: z.object({
        habitId: z.string(),
        habitName: z.string().describe('Human-readable name for the UI'),
        notes: z.string().optional(),
      }),
    }),

    createHabitBlock: tool({
      description:
        'Propose creating a recurring calendar block for an existing habit (puts the habit on the calendar at a fixed time). Requires Google Calendar connected. Requires user approval.',
      inputSchema: z.object({
        habitId: z.string(),
        habitName: z.string().describe('For display'),
        startTime: z.string().describe('HH:MM (24h)'),
        endTime: z.string().describe('HH:MM (24h)'),
        frequencyType: z.string().describe('daily | weekly | etc.'),
        weekDays: z.array(z.string()).optional().describe('For weekly: MO, TU, WE, TH, FR, SA, SU'),
        description: z.string().optional(),
      }),
    }),
  }
}

export function habitServerTools(userId: string) {
  return {
    createHabit: tool({
      description: 'Create a new habit for the user',
      inputSchema: z.object({
        name: z.string().describe('Habit name'),
        description: z.string().optional().describe('Habit description'),
        frequencyType: z.enum(['daily', 'weekly']).optional().describe('How often the habit should be done'),
        targetFrequency: z.number().optional().describe('Target times per frequency period'),
      }),
      execute: async ({ name, description, frequencyType, targetFrequency }) => {
        const habit = await prisma.task.create({
          data: {
            userId,
            kind: 'HABIT',
            title: name,
            description,
            tags: [],
            habitMeta: {
              category: null,
              color: '#3B82F6',
              targetFrequency: targetFrequency || 1,
              frequencyType: frequencyType || 'daily',
              weekDays: [],
            } as any,
          },
        })
        return { success: true, habit: { id: habit.id, name: habit.title } }
      },
    }),

    logHabit: tool({
      description: 'Log a habit completion for today',
      inputSchema: z.object({
        habitId: z.string().describe('The ID of the habit to log'),
        notes: z.string().optional().describe('Optional notes for the log entry'),
      }),
      execute: async ({ habitId, notes }) => {
        const habit = await prisma.task.findFirst({
          where: { id: habitId, userId, kind: 'HABIT' },
        })
        if (!habit) return { success: false, error: 'Habit not found' }

        const settings = await prisma.userSettings.findUnique({
          where: { userId },
          select: { timezone: true },
        })
        const tz = settings?.timezone ?? 'UTC'
        const today = startOfLocalDayUtc(new Date(), tz)

        const log = await prisma.habitLog.upsert({
          where: { taskId_date: { taskId: habitId, date: today } },
          create: {
            taskId: habitId,
            userId,
            date: today,
            completedCount: 1,
            notes,
          },
          update: {
            completedCount: { increment: 1 },
            notes,
          },
        })
        return { success: true, log: { id: log.id, habitName: habit.title, completedCount: log.completedCount } }
      },
    }),
  }
}
