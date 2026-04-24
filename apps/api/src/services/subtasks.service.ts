import { subtasksRepo, type SubtaskCreate } from '../repositories/subtasks.repo'

class SubtasksService {
  async list(userId: string, taskId: string) {
    const owned = await subtasksRepo.taskOwnedBy(taskId, userId)
    if (!owned) return { ok: false as const, reason: 'not_found' as const }
    const data = await subtasksRepo.listByTask(taskId)
    return { ok: true as const, data }
  }

  async create(userId: string, taskId: string, input: SubtaskCreate) {
    const owned = await subtasksRepo.taskOwnedBy(taskId, userId)
    if (!owned) return { ok: false as const, reason: 'not_found' as const }
    const lastPos = await subtasksRepo.findLastPosition(taskId)
    const subtask = await subtasksRepo.create(taskId, {
      ...input,
      position: input.position ?? lastPos + 1,
    })
    return { ok: true as const, subtask }
  }

  async update(userId: string, id: string, data: Partial<{ title: string; isCompleted: boolean; plannedTimeMinutes: number | null; actualTimeMinutes: number; position: number }>) {
    const row = await subtasksRepo.update(id, userId, data)
    if (!row) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const, subtask: row }
  }

  async delete(userId: string, id: string) {
    const ok = await subtasksRepo.delete(id, userId)
    return ok
  }
}

export const subtasksService = new SubtasksService()
