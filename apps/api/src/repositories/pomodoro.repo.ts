/**
 * Pomodoro Repository — translation layer over WorkingSession{kind: POMODORO | BREAK}.
 *
 * Mapping:
 *   PomodoroSession.id            ↔ WorkingSession.id
 *   PomodoroSession.userId        ↔ WorkingSession.userId
 *   PomodoroSession.taskId        ↔ WorkingSession.taskId
 *   sessionType: 'focus'          ↔ kind: POMODORO
 *   sessionType: 'short_break'    ↔ kind: BREAK + notes prefix "[st:short_break]"
 *   sessionType: 'long_break'     ↔ kind: BREAK + notes prefix "[st:long_break]"
 *   plannedDuration (min)         ↔ end - start (initial); preserved on completion via notes "[pd:N]"
 *   actualDuration (min)          ↔ (end - start) after completion + end update
 *   startedAt                     ↔ start
 *   completedAt                   ↔ updatedAt when completed=true
 *   isCompleted                   ↔ completed
 *   notes                         ↔ notes (with encoding stripped)
 */
import { prisma } from '../lib/prisma'

type Kind = 'POMODORO' | 'BREAK'

function encodeNotes(sessionType: string, plannedDuration: number, notes: string | null | undefined): string {
  const body = notes ? ` ${notes}` : ''
  const stTag = sessionType && sessionType !== 'focus' ? `[st:${sessionType}]` : ''
  return `[pd:${plannedDuration}]${stTag}${body}`.trim()
}

function decodeNotes(raw: string | null | undefined): { sessionType: string; plannedDuration: number | null; notes: string | null } {
  if (!raw) return { sessionType: 'focus', plannedDuration: null, notes: null }
  let rest = raw
  let plannedDuration: number | null = null
  let sessionType = 'focus'
  const pdMatch = rest.match(/^\[pd:(\d+)\]\s?/)
  if (pdMatch) {
    plannedDuration = Number(pdMatch[1])
    rest = rest.slice(pdMatch[0].length)
  }
  const stMatch = rest.match(/^\[st:([a-z_]+)\]\s?/)
  if (stMatch) {
    sessionType = stMatch[1]!
    rest = rest.slice(stMatch[0].length)
  }
  return { sessionType, plannedDuration, notes: rest.trim() || null }
}

function toPomodoroDTO(ws: any) {
  const { sessionType, plannedDuration, notes } = decodeNotes(ws.notes)
  const start = ws.start instanceof Date ? ws.start : new Date(ws.start)
  const end = ws.end instanceof Date ? ws.end : new Date(ws.end)
  const durationFromRange = Math.round((end.getTime() - start.getTime()) / 60_000)
  const completed = Boolean(ws.completed)
  return {
    id: ws.id,
    userId: ws.userId,
    taskId: ws.taskId ?? null,
    sessionType,
    plannedDuration: plannedDuration ?? durationFromRange,
    actualDuration: completed ? durationFromRange : null,
    startedAt: start,
    completedAt: completed ? ws.updatedAt : null,
    isCompleted: completed,
    notes,
    createdAt: ws.createdAt,
    task: ws.task ? { id: ws.task.id, title: ws.task.title } : null,
  }
}

function kindForSessionType(sessionType: string): Kind {
  return sessionType === 'focus' ? 'POMODORO' : 'BREAK'
}

function translateWhereForPomodoro(where: Record<string, unknown>): any {
  // Accept legacy field names in incoming where, translate for WorkingSession.
  const out: any = {}
  for (const [k, v] of Object.entries(where)) {
    switch (k) {
      case 'userId':
      case 'taskId':
        out[k] = v
        break
      case 'isCompleted':
        out.completed = v
        break
      case 'sessionType':
        out.kind = kindForSessionType(String(v))
        break
      case 'startedAt':
        out.start = v
        break
      case 'createdAt':
        out.createdAt = v
        break
      default:
        // pass-through (caller might include prisma-shaped filters)
        out[k] = v
    }
  }
  // Default: only POMODORO/BREAK sessions
  if (!('kind' in out)) out.kind = { in: ['POMODORO', 'BREAK'] }
  return out
}

class PomodoroRepository {
  async findManySessions(where: Record<string, unknown>, opts: { limit: number; offset: number }) {
    const rows = await prisma.workingSession.findMany({
      where: translateWhereForPomodoro(where),
      orderBy: { start: 'desc' },
      take: opts.limit,
      skip: opts.offset,
      include: { task: { select: { id: true, title: true } } },
    })
    return rows.map(toPomodoroDTO)
  }

  async countSessions(where: Record<string, unknown>) {
    return prisma.workingSession.count({ where: translateWhereForPomodoro(where) })
  }

  async createSession(data: {
    userId: string
    sessionType: string
    plannedDuration: number
    taskId: string | null
    startedAt: Date
    isCompleted: boolean
  }) {
    const start = data.startedAt
    const end = new Date(start.getTime() + data.plannedDuration * 60_000)
    const row = await prisma.workingSession.create({
      data: {
        userId: data.userId,
        taskId: data.taskId ?? null,
        kind: kindForSessionType(data.sessionType),
        start,
        end,
        createdBy: 'USER',
        completed: data.isCompleted,
        notes: encodeNotes(data.sessionType, data.plannedDuration, null),
      },
      include: { task: { select: { id: true, title: true } } },
    })
    return toPomodoroDTO(row)
  }

  async findSessionByIdAndUser(id: string, userId: string) {
    const row = await prisma.workingSession.findFirst({
      where: { id, userId, kind: { in: ['POMODORO', 'BREAK'] } },
      include: { task: { select: { id: true, title: true } } },
    })
    return row ? toPomodoroDTO(row) : null
  }

  async findSessionOwnership(id: string, userId: string) {
    const row = await prisma.workingSession.findFirst({
      where: { id, userId, kind: { in: ['POMODORO', 'BREAK'] } },
    })
    return row ? toPomodoroDTO(row) : null
  }

  async updateSession(id: string, data: Record<string, unknown>) {
    // Translate legacy fields.
    const existing = await prisma.workingSession.findUnique({ where: { id } })
    if (!existing) throw new Error('Pomodoro session not found')
    const decoded = decodeNotes(existing.notes)
    const updateData: any = {}
    if (data.isCompleted !== undefined) updateData.completed = Boolean(data.isCompleted)
    if (data.actualDuration !== undefined) {
      // Truncate end to reflect actual elapsed minutes
      const actualMin = Number(data.actualDuration)
      updateData.end = new Date(existing.start.getTime() + actualMin * 60_000)
    }
    if (data.notes !== undefined || data.sessionType !== undefined) {
      const sessionType = (data.sessionType as string | undefined) ?? decoded.sessionType
      const plannedDuration = decoded.plannedDuration ?? Math.round((existing.end.getTime() - existing.start.getTime()) / 60_000)
      const rawNotes = data.notes !== undefined ? (data.notes as string | null) : decoded.notes
      updateData.notes = encodeNotes(sessionType, plannedDuration, rawNotes ?? null)
    }
    const row = await prisma.workingSession.update({
      where: { id },
      data: updateData,
      include: { task: { select: { id: true, title: true } } },
    })
    return toPomodoroDTO(row)
  }

  async deleteSession(id: string) {
    return prisma.workingSession.delete({ where: { id } })
  }

  async createXpEvent(data: {
    userId: string
    source: string
    sourceId: string
    amount: number
    earnedDate: string
    metadata: Record<string, unknown>
  }) {
    return prisma.xpEvent.create({ data: data as any })
  }

  async countCompletedFocus(userId: string) {
    return prisma.workingSession.count({
      where: { userId, kind: 'POMODORO', completed: true },
    })
  }

  async sumFocusMinutes(userId: string) {
    // Sum actual elapsed minutes (end - start) for completed POMODOROs.
    const rows = await prisma.workingSession.findMany({
      where: { userId, kind: 'POMODORO', completed: true },
      select: { start: true, end: true },
    })
    const total = rows.reduce(
      (sum: number, r: { start: Date; end: Date }) =>
        sum + Math.round((r.end.getTime() - r.start.getTime()) / 60_000),
      0,
    )
    return { _sum: { plannedDuration: total } }
  }

  async countCompletedFocusInRange(userId: string, gte: Date, lte?: Date) {
    return prisma.workingSession.count({
      where: {
        userId,
        kind: 'POMODORO',
        completed: true,
        start: lte ? { gte, lte } : { gte },
      },
    })
  }
}

export const pomodoroRepo = new PomodoroRepository()
