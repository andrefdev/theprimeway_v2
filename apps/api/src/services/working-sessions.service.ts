import { workingSessionsRepo, type SessionCreate } from '../repositories/working-sessions.repo'
import { schedulingFacade } from './scheduling/scheduling-facade'

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
      return {
        ok: false as const,
        reason: 'invalid_range' as const,
        message: 'end must be after start',
      }
    }
    // Route through SchedulingFacade so Task mirror, Google push, deconflict
    // and sync events stay consistent with all other entry points.
    const r = await schedulingFacade.createSession(
      {
        userId,
        taskId: data.taskId ?? null,
        start: data.start,
        end: data.end,
        kind: data.kind,
        createdBy: data.createdBy,
      },
      { deconflict: false }, // manual creation: caller decides via update flow
    )
    const session = await workingSessionsRepo.findById(r.session.id)
    return { ok: true as const, session }
  }

  async update(userId: string, id: string, data: Partial<SessionCreate>) {
    // Delegate to facade so Task mirror, Google patch, and sync events stay
    // consistent with drag/drop and timer-start moves.
    if (data.start || data.end) {
      const existing = await workingSessionsRepo.findByIdAndUser(id, userId)
      if (!existing) return { ok: false as const, reason: 'not_found' as const }
      const newStart = data.start ?? existing.start
      const newEnd = data.end ?? existing.end
      const r = await schedulingFacade.moveSession(userId, id, newStart, newEnd, {
        deconflict: false,
      })
      if (!r.ok) return { ok: false as const, reason: 'not_found' as const }
    }
    // Non-time fields (taskId, kind, etc.) — write directly; no facade flow needed.
    const otherFields: Partial<SessionCreate> = {}
    if (data.taskId !== undefined) otherFields.taskId = data.taskId
    if (data.kind !== undefined) otherFields.kind = data.kind
    if (data.externalCalendarId !== undefined) otherFields.externalCalendarId = data.externalCalendarId
    if (data.externalEventId !== undefined) otherFields.externalEventId = data.externalEventId
    if (Object.keys(otherFields).length > 0) {
      const ok = await workingSessionsRepo.update(id, userId, otherFields)
      if (!ok) return { ok: false as const, reason: 'not_found' as const }
    }
    return { ok: true as const, session: await workingSessionsRepo.findById(id) }
  }

  async delete(userId: string, id: string) {
    const r = await schedulingFacade.removeSession(userId, id)
    if (!r.ok) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const }
  }
}

export const workingSessionsService = new WorkingSessionsService()
