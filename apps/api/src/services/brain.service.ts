/**
 * Brain service — Second Brain Phase 1 (text only).
 *
 * Pipeline: user submits a short thought → entry created with status=pending →
 * we kick off processEntry fire-and-forget. processEntry gathers the user's
 * open tasks, active goals, active habits, and recent notes; calls
 * generateObject with taskModel; fuzzy-resolves the AI-proposed cross-link
 * targets against real user data; persists the result + cross-links.
 *
 * Action items live on the entry as JSON (actionItems[]) and are applied
 * explicitly by the user via applyActionItem (Suggest + one-click apply).
 */
import { prisma } from '../lib/prisma'
import { brainRepo, type CrossLinkInput } from '../repositories/brain.repo'
import { tasksService } from './tasks.service'
import { gamificationEvents } from './gamification/events'
import { gamificationService } from './gamification.service'
import { bestMatch } from '../lib/fuzzy-match'
import { enforceLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'

type TargetType = 'task' | 'goal' | 'habit'
type LinkType = 'related' | 'spawned_from' | 'action_for' | 'evidence_for'

interface ActionItem {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  appliedTaskId?: string
}

interface Candidate {
  id: string
  title: string
}

class BrainService {
  // ─── Public surface ─────────────────────────────────────

  list(userId: string, opts: { status?: string; search?: string; limit?: number; offset?: number }) {
    return brainRepo.findMany(userId, opts)
  }

  async get(userId: string, id: string) {
    const entry = await brainRepo.findById(id, userId)
    if (!entry) return { ok: false as const, reason: 'not_found' as const }
    // Hydrate cross-link targets with a lightweight title lookup.
    const hydrated = await this.hydrateCrossLinks(userId, entry.crossLinks)
    return { ok: true as const, entry: { ...entry, crossLinks: hydrated } }
  }

  async create(userId: string, content: string) {
    await enforceLimit(userId, FEATURES.BRAIN_ENTRIES_LIMIT)
    const entry = await brainRepo.create(userId, { rawTranscript: content })
    // Fire-and-forget. Failures mark entry as 'failed' inside processEntry.
    this.processEntry(userId, entry.id).catch((err) =>
      console.error('[BRAIN_PIPELINE]', entry.id, err),
    )
    return entry
  }

  async userUpdate(userId: string, id: string, patch: { userTitle?: string; topics?: string[]; isPinned?: boolean; isArchived?: boolean }) {
    const row = await brainRepo.updateUser(id, userId, patch)
    if (!row) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const, entry: row }
  }

  async delete(userId: string, id: string) {
    return brainRepo.softDelete(id, userId)
  }

  async reprocess(userId: string, id: string) {
    const row = await brainRepo.resetToPending(id, userId)
    if (!row) return { ok: false as const, reason: 'not_found' as const }
    this.processEntry(userId, id).catch((err) => console.error('[BRAIN_REPROCESS]', id, err))
    return { ok: true as const, entry: row }
  }

  /**
   * Apply an AI-suggested action item: create a Task and persist a cross-link.
   * Index is the position inside entry.actionItems (which the client shows).
   */
  async applyActionItem(userId: string, entryId: string, index: number) {
    const entry = await brainRepo.findById(entryId, userId)
    if (!entry) return { ok: false as const, reason: 'not_found' as const }
    const items = (entry.actionItems as unknown as ActionItem[]) ?? []
    const item = items[index]
    if (!item) return { ok: false as const, reason: 'item_not_found' as const }
    if (item.appliedTaskId) {
      return { ok: false as const, reason: 'already_applied' as const, taskId: item.appliedTaskId }
    }

    const task = await tasksService.createTask(userId, {
      title: item.title,
      description: item.description,
      priority: item.priority,
      source: 'brain_entry',
    })

    // Mark the action item as applied in-place and link to the new task.
    const nextItems = items.map((it, i) => (i === index ? { ...it, appliedTaskId: task.id } : it))
    await Promise.all([
      brainRepo.updatePipeline(entry.id, { actionItems: nextItems }),
      brainRepo.createCrossLinks(entry.id, userId, [
        { targetType: 'task', targetId: task.id, linkType: 'action_for', aiGenerated: false },
      ]),
    ])
    return { ok: true as const, task }
  }

  // ─── Pipeline ───────────────────────────────────────────

  async processEntry(userId: string, entryId: string): Promise<void> {
    await brainRepo.updatePipeline(entryId, { status: 'analyzing' })
    try {
      const entry = await prisma.brainEntry.findFirst({ where: { id: entryId, userId } })
      if (!entry || !entry.rawTranscript) {
        await brainRepo.updatePipeline(entryId, { status: 'failed', errorMessage: 'Empty transcript' })
        return
      }

      const [tasks, goals, habits] = await Promise.all([
        prisma.task.findMany({
          where: { userId, status: 'open', kind: 'TASK', archivedAt: null },
          select: { id: true, title: true },
          orderBy: { updatedAt: 'desc' },
          take: 40,
        }),
        prisma.goal.findMany({
          where: { userId, status: 'ACTIVE', horizon: { in: ['ONE_YEAR', 'QUARTER', 'WEEK'] } },
          select: { id: true, title: true },
          take: 40,
        }),
        prisma.task.findMany({
          where: { userId, kind: 'HABIT', archivedAt: null },
          select: { id: true, title: true },
          take: 20,
        }),
      ])

      const taskCandidates: Candidate[] = tasks.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))
      const goalCandidates: Candidate[] = goals.map((g: { id: string; title: string }) => ({ id: g.id, title: g.title }))
      const habitCandidates: Candidate[] = habits.map((h: { id: string; title: string }) => ({ id: h.id, title: h.title }))

      const { generateObject } = await import('ai')
      const { z: zod } = await import('zod')
      const { taskModel } = await import('../lib/ai-models')

      const prompt = `You are an intelligent knowledge companion organizing a user's thought.

USER THOUGHT:
"""
${entry.rawTranscript}
"""

USER CONTEXT (for cross-linking — do NOT invent items, only reference these exact titles):
OPEN TASKS:
${taskCandidates.slice(0, 20).map((t) => `- ${t.title}`).join('\n') || '(none)'}

ACTIVE GOALS:
${goalCandidates.map((g) => `- ${g.title}`).join('\n') || '(none)'}

ACTIVE HABITS:
${habitCandidates.map((h) => `- ${h.title}`).join('\n') || '(none)'}

Produce structured output:
- title: a crisp 3-8 word summary of the thought
- summary: one or two sentences
- topics: 3 to 5 short lowercase tags
- actionItems: concrete next steps implicit in the thought (may be empty)
- crossLinks: references to the user's real items above. targetTitle MUST match one of the titles listed. Drop anything you're unsure about.
- sentiment: positive | neutral | negative`

      const schema = zod.object({
        title: zod.string().min(1).max(120),
        summary: zod.string().min(1).max(500),
        topics: zod.array(zod.string()).min(0).max(8),
        actionItems: zod
          .array(
            zod.object({
              title: zod.string().min(1).max(200),
              description: zod.string().max(500).optional(),
              priority: zod.enum(['low', 'medium', 'high']).optional(),
            }),
          )
          .max(10),
        crossLinks: zod
          .array(
            zod.object({
              targetType: zod.enum(['task', 'goal', 'habit']),
              targetTitle: zod.string().min(1),
              linkType: zod.enum(['related', 'spawned_from', 'action_for', 'evidence_for']),
            }),
          )
          .max(10),
        sentiment: zod.enum(['positive', 'neutral', 'negative']).optional(),
      })

      const result = await generateObject({ model: taskModel, schema, prompt })
      const out = result.object

      // Resolve cross-links against real user data — drop anything we can't match.
      const resolved: CrossLinkInput[] = []
      const pools: Record<TargetType, Candidate[]> = {
        task: taskCandidates,
        goal: goalCandidates,
        habit: habitCandidates,
      }
      for (const link of out.crossLinks) {
        const pool = pools[link.targetType as TargetType]
        if (!pool || pool.length === 0) continue
        const match = bestMatch(link.targetTitle, pool)
        if (!match) continue
        resolved.push({
          targetType: link.targetType as TargetType,
          targetId: match.id,
          linkType: link.linkType as LinkType,
        })
      }

      await prisma.$transaction([
        prisma.brainEntry.update({
          where: { id: entryId },
          data: {
            status: 'complete',
            title: out.title,
            summary: out.summary,
            topics: out.topics as any,
            actionItems: out.actionItems as any,
            sentiment: out.sentiment ?? null,
            aiMetadata: { model: 'taskModel', tokensIn: undefined, tokensOut: undefined } as any,
            processedAt: new Date(),
          },
        }),
        ...(resolved.length > 0
          ? [
              prisma.brainCrossLink.createMany({
                data: resolved.map((l) => ({
                  entryId,
                  userId,
                  targetType: l.targetType,
                  targetId: l.targetId,
                  linkType: l.linkType,
                  aiGenerated: true,
                })),
                skipDuplicates: true,
              }),
            ]
          : []),
      ])

      gamificationService
        .awardXp(userId, {
          source: 'brain_entry',
          sourceId: entryId,
          amount: 10,
          metadata: { title: out.title },
        })
        .catch((err) => console.error('[BRAIN_XP]', err))
      gamificationEvents.emit('brain.entry.created', { userId, meta: { entryId } })
    } catch (err) {
      console.error('[BRAIN_PIPELINE_FAIL]', entryId, err)
      await brainRepo
        .updatePipeline(entryId, {
          status: 'failed',
          errorMessage: (err as Error).message?.slice(0, 500) ?? 'AI pipeline failed',
        })
        .catch(() => undefined)
    }
  }

  // ─── Private helpers ────────────────────────────────────

  private async hydrateCrossLinks(userId: string, links: any[]): Promise<any[]> {
    if (!links || links.length === 0) return []
    const byType = { task: [] as string[], goal: [] as string[], habit: [] as string[] }
    for (const l of links) {
      if (l.targetType === 'task') byType.task.push(l.targetId)
      else if (l.targetType === 'goal') byType.goal.push(l.targetId)
      else if (l.targetType === 'habit') byType.habit.push(l.targetId)
    }

    const [tasks, goals, habits] = await Promise.all([
      byType.task.length
        ? prisma.task.findMany({ where: { userId, id: { in: byType.task } }, select: { id: true, title: true } })
        : Promise.resolve([]),
      byType.goal.length
        ? prisma.goal.findMany({ where: { userId, id: { in: byType.goal } }, select: { id: true, title: true } })
        : Promise.resolve([]),
      byType.habit.length
        ? prisma.task.findMany({
            where: { userId, id: { in: byType.habit }, kind: 'HABIT' },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
    ])

    const byId = new Map<string, { id: string; title: string }>()
    for (const arr of [tasks, goals, habits]) for (const x of arr as any[]) byId.set(x.id, x)
    return links.map((l) => ({ ...l, target: byId.get(l.targetId) ?? null }))
  }
}

export const brainService = new BrainService()
