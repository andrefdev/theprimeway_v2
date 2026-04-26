import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

export interface BrainEntryCreate {
  sourceType?: string
  sourceDevice?: string
  rawTranscript: string
  language?: string
}

export interface BrainEntryPipelinePatch {
  status?: string
  title?: string | null
  summary?: string | null
  topics?: unknown
  sentiment?: string | null
  actionItems?: unknown
  aiMetadata?: unknown
  errorMessage?: string | null
  processedAt?: Date | null
}

export interface BrainEntryUserPatch {
  userTitle?: string | null
  topics?: unknown
  isPinned?: boolean
  isArchived?: boolean
}

export interface CrossLinkInput {
  targetType: 'task' | 'goal' | 'habit'
  targetId: string
  linkType: 'related' | 'spawned_from' | 'action_for' | 'evidence_for'
  aiGenerated?: boolean
}

class BrainRepository {
  findMany(
    userId: string,
    opts: { status?: string; search?: string; limit?: number; offset?: number } = {},
  ) {
    const where: any = { userId, deletedAt: null }
    if (opts.status) where.status = opts.status
    if (opts.search) {
      where.OR = [
        { title: { contains: opts.search, mode: 'insensitive' } },
        { rawTranscript: { contains: opts.search, mode: 'insensitive' } },
      ]
    }
    return prisma.brainEntry.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    })
  }

  findById(id: string, userId: string) {
    return prisma.brainEntry.findFirst({
      where: { id, userId, deletedAt: null },
      include: { crossLinks: true },
    })
  }

  create(userId: string, data: BrainEntryCreate) {
    return prisma.brainEntry.create({
      data: {
        userId,
        sourceType: data.sourceType ?? 'text',
        sourceDevice: data.sourceDevice,
        rawTranscript: data.rawTranscript,
        language: data.language ?? 'en',
        status: 'pending',
      },
    })
  }

  updatePipeline(id: string, patch: BrainEntryPipelinePatch) {
    return prisma.brainEntry.update({
      where: { id },
      data: {
        ...patch,
        topics: patch.topics as Prisma.InputJsonValue | undefined,
        actionItems: patch.actionItems as Prisma.InputJsonValue | undefined,
        aiMetadata: patch.aiMetadata as Prisma.InputJsonValue | undefined,
      },
    })
  }

  async updateUser(id: string, userId: string, patch: BrainEntryUserPatch) {
    const r = await prisma.brainEntry.updateMany({
      where: { id, userId, deletedAt: null },
      data: {
        ...patch,
        topics: patch.topics as Prisma.InputJsonValue | undefined,
      },
    })
    if (r.count === 0) return null
    return prisma.brainEntry.findUnique({ where: { id } })
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const r = await prisma.brainEntry.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    return r.count > 0
  }

  async resetToPending(id: string, userId: string) {
    const r = await prisma.brainEntry.updateMany({
      where: { id, userId, deletedAt: null },
      data: {
        status: 'pending',
        errorMessage: null,
        processedAt: null,
      },
    })
    if (r.count === 0) return null
    return prisma.brainEntry.findUnique({ where: { id } })
  }

  createCrossLinks(entryId: string, userId: string, links: CrossLinkInput[]) {
    if (links.length === 0) return Promise.resolve({ count: 0 })
    return prisma.brainCrossLink.createMany({
      data: links.map((l) => ({
        entryId,
        userId,
        targetType: l.targetType,
        targetId: l.targetId,
        linkType: l.linkType,
        aiGenerated: l.aiGenerated ?? true,
      })),
      skipDuplicates: true,
    })
  }

  deleteCrossLinks(entryId: string) {
    return prisma.brainCrossLink.deleteMany({ where: { entryId } })
  }
}

export const brainRepo = new BrainRepository()
