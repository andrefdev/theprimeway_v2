import { toast } from 'sonner'
import { tasksApi } from '@/features/tasks/api'
import { tasksQueries } from '@/features/tasks/queries'
import type { ToolHandler } from '../types'
import type { TaskPriority, TaskStatus } from '@repo/shared/types'

export interface CreateTaskArgs {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  scheduledDate?: string
}

export interface UpdateTaskArgs {
  taskId: string
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  scheduledDate?: string
}

export interface CompleteTaskArgs {
  taskId: string
}

export interface DeleteTaskArgs {
  taskId: string
}

export const createTaskHandler: ToolHandler<CreateTaskArgs> = {
  name: 'createTask',
  execute: async (args, { queryClient, t }) => {
    const task = await tasksApi.create({
      title: args.title,
      description: args.description,
      priority: args.priority ?? 'medium',
      dueDate: args.dueDate,
      scheduledDate: args.scheduledDate,
    })
    queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    toast.success(t('taskCreated', { ns: 'tasks', defaultValue: 'Task created' }))
    const t2 = task as unknown as { id: string; title: string } | { data: { id: string; title: string } }
    const t3 = 'data' in t2 ? t2.data : t2
    return { success: true, task: { id: t3.id, title: t3.title } }
  },
}

export const updateTaskHandler: ToolHandler<UpdateTaskArgs> = {
  name: 'updateTask',
  execute: async (args, { queryClient, t }) => {
    const patch: Record<string, unknown> = {}
    for (const k of ['title', 'description', 'priority', 'dueDate', 'scheduledDate'] as const) {
      if (args[k] !== undefined) patch[k] = args[k]
    }
    const task = await tasksApi.update(args.taskId, patch)
    queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    toast.success(t('taskUpdated', { ns: 'tasks', defaultValue: 'Task updated' }))
    const t2 = task as unknown as { id: string } | { data: { id: string } }
    const t3 = 'data' in t2 ? t2.data : t2
    return { success: true, task: { id: t3.id } }
  },
}

export const completeTaskHandler: ToolHandler<CompleteTaskArgs> = {
  name: 'completeTask',
  execute: async (args, { queryClient, t }) => {
    const task = await tasksApi.update(args.taskId, { status: 'completed' as TaskStatus })
    queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    toast.success(t('taskCompleted', { ns: 'tasks', defaultValue: 'Task completed' }))
    const t2 = task as unknown as { id: string } | { data: { id: string } }
    const t3 = 'data' in t2 ? t2.data : t2
    return { success: true, task: { id: t3.id, status: 'completed' } }
  },
}

export const deleteTaskHandler: ToolHandler<DeleteTaskArgs> = {
  name: 'deleteTask',
  execute: async (args, { queryClient, t }) => {
    await tasksApi.delete(args.taskId)
    queryClient.invalidateQueries({ queryKey: tasksQueries.all() })
    toast.success(t('taskDeleted', { ns: 'tasks', defaultValue: 'Task deleted' }))
    return { success: true, taskId: args.taskId }
  },
}
