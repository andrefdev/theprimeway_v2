import { tool } from 'ai'
import { z } from 'zod'
import { tasksRepository } from '../../repositories/tasks.repo'

export function taskReadTools(userId: string) {
  return {
    listTasks: tool({
      description: "List the user's open tasks",
      inputSchema: z.object({
        limit: z.number().optional().describe('Max number of tasks to return (default 10)'),
      }),
      execute: async ({ limit }) => {
        const tasks = await tasksRepository.findOpenTasks(userId, limit || 10)
        return {
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
            status: t.status,
          })),
        }
      },
    }),
  }
}

export function taskClientTools() {
  return {
    createTask: tool({
      description: 'Propose creating a new task. Requires user approval in the UI.',
      inputSchema: z.object({
        title: z.string().describe('Task title'),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        dueDate: z.string().optional().describe('YYYY-MM-DD'),
        scheduledDate: z.string().optional().describe('YYYY-MM-DD'),
      }),
    }),

    updateTask: tool({
      description: 'Propose updating an existing task. Requires user approval.',
      inputSchema: z.object({
        taskId: z.string(),
        taskTitle: z.string().describe('Current title for display'),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        dueDate: z.string().optional(),
        scheduledDate: z.string().optional(),
      }),
    }),

    deleteTask: tool({
      description: 'Propose deleting a task. Requires user approval.',
      inputSchema: z.object({
        taskId: z.string(),
        taskTitle: z.string().describe('For display in the confirmation UI'),
      }),
    }),

    completeTask: tool({
      description: 'Propose marking a task as completed. Requires user approval.',
      inputSchema: z.object({
        taskId: z.string(),
        taskTitle: z.string().describe('Human-readable title to display in the confirmation UI'),
      }),
    }),

    autoScheduleTask: tool({
      description:
        'Propose auto-scheduling a single task into the next available free slot on a given day. Requires user approval.',
      inputSchema: z.object({
        taskId: z.string(),
        taskTitle: z.string().describe('For display'),
        day: z.string().describe('YYYY-MM-DD'),
        preventSplit: z.boolean().optional(),
      }),
    }),
  }
}

export function taskServerTools(userId: string) {
  return {
    createTask: tool({
      description: 'Create a new task for the user',
      inputSchema: z.object({
        title: z.string().describe('Task title'),
        description: z.string().optional().describe('Task description'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Task priority'),
        dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
        scheduledDate: z.string().optional().describe('Scheduled date in YYYY-MM-DD format'),
      }),
      execute: async ({ title, description, priority, dueDate, scheduledDate }) => {
        const task = await tasksRepository.create(userId, {
          title,
          description,
          priority: priority || 'medium',
          dueDate,
          scheduledDate,
        })
        return { success: true, task: { id: task.id, title: task.title, status: task.status } }
      },
    }),

    completeTask: tool({
      description: 'Mark an existing task as completed',
      inputSchema: z.object({
        taskId: z.string().describe('The ID of the task to complete'),
      }),
      execute: async ({ taskId }) => {
        const task = await tasksRepository.update(userId, taskId, { status: 'completed' })
        if (!task) return { success: false, error: 'Task not found' }
        return { success: true, task: { id: task.id, title: task.title, status: task.status } }
      },
    }),
  }
}
