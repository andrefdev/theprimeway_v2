import { workingSessionsRepo, type SessionCreate } from '../repositories/working-sessions.repo'
import { calendarService } from './calendar.service'

export type WorkingSessionsError =
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'invalid_range'; message: string }

class WorkingSessionsService {
  async list(userId: string, filters: { from?: string; to?: string; taskId?: string }) {
    return workingSessionsRepo.findMany(userId, {
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
      taskId: filters.taskId,
    })
  }

  async create(userId: string, data: SessionCreate) {
    if (data.end <= data.start) {
      return { ok: false as const, reason: 'invalid_range' as const, message: 'end must be after start' }
    }
    return { ok: true as const, session: await workingSessionsRepo.create(userId, data) }
  }

  async update(userId: string, id: string, data: Partial<SessionCreate>) {
    const ok = await workingSessionsRepo.update(id, userId, data)
    if (!ok) return { ok: false as const, reason: 'not_found' as const }
    // Best-effort: mirror new start/end to Google Calendar if session is linked.
    if (data.start || data.end) {
      calendarService
        .updateSessionOnCalendar(id)
        .catch((err) => console.error('[SESSION_PATCH] update calendar failed', err))
    }
    return { ok: true as const, session: await workingSessionsRepo.findById(id) }
  }

  async delete(userId: string, id: string) {
    const existing = await workingSessionsRepo.findByIdAndUser(id, userId)
    if (!existing) return { ok: false as const, reason: 'not_found' as const }
    calendarService
      .removeSessionFromCalendar(id)
      .catch((err) => console.error('[SESSION_DELETE] remove from calendar failed', err))
    await workingSessionsRepo.delete(id)
    return { ok: true as const }
  }
}

export const workingSessionsService = new WorkingSessionsService()
