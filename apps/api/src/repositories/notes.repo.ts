/**
 * Notes Repository — Pure data access layer
 *
 * Responsibilities:
 * - Direct Prisma queries for notes and note categories
 * - Returns Prisma objects directly (camelCase)
 * - NO business logic, NO HTTP concerns
 */
import { prisma } from '../lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FindNotesOptions {
  categoryId?: string
  isPinned?: boolean
  isArchived?: boolean
  search?: string
  limit?: number
  offset?: number
}

const defaultNoteInclude = { category: true }

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------
class NotesRepository {
  // ── Notes CRUD ─────────────────────────────────────────────────────────

  async findMany(
    userId: string,
    options: FindNotesOptions = {},
  ) {
    const where: Record<string, unknown> = { userId, deletedAt: null }
    if (options.categoryId) where.categoryId = options.categoryId
    if (options.isPinned !== undefined) where.isPinned = options.isPinned
    if (options.isArchived !== undefined) where.isArchived = options.isArchived
    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [notes, count] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        ...(options.limit !== undefined && { take: options.limit }),
        ...(options.offset !== undefined && { skip: options.offset }),
        include: defaultNoteInclude,
      }),
      prisma.note.count({ where }),
    ])

    return { notes, count }
  }

  async findById(userId: string, noteId: string) {
    return prisma.note.findFirst({
      where: { id: noteId, userId },
      include: defaultNoteInclude,
    })
  }

  async create(
    userId: string,
    data: {
      title: string
      content?: string
      categoryId?: string
      isPinned?: boolean
      isArchived?: boolean
      tags?: string[]
    },
  ) {
    return prisma.note.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        isPinned: data.isPinned ?? false,
        isArchived: data.isArchived ?? false,
        tags: data.tags ?? [],
      },
      include: defaultNoteInclude,
    })
  }

  async update(userId: string, noteId: string, data: Record<string, unknown>) {
    const existing = await prisma.note.findFirst({ where: { id: noteId, userId } })
    if (!existing) return null

    return prisma.note.update({
      where: { id: noteId },
      data,
      include: defaultNoteInclude,
    })
  }

  async softDelete(userId: string, noteId: string) {
    const existing = await prisma.note.findFirst({ where: { id: noteId, userId } })
    if (!existing) return null

    return prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
      include: defaultNoteInclude,
    })
  }

  async restore(userId: string, noteId: string) {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: { not: null } },
    })
    if (!existing) return null

    return prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: null },
      include: defaultNoteInclude,
    })
  }

  // ── Trash ──────────────────────────────────────────────────────────────

  async findTrashed(userId: string) {
    const where = { userId, deletedAt: { not: null } }
    const [notes, count] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        include: defaultNoteInclude,
      }),
      prisma.note.count({ where }),
    ])
    return { notes, count }
  }

  async emptyTrash(userId: string): Promise<number> {
    const result = await prisma.note.deleteMany({
      where: { userId, deletedAt: { not: null } },
    })
    return result.count
  }

  async purgeExpiredNotes(userId: string, retentionDays: number): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)

    await prisma.note.deleteMany({
      where: {
        userId,
        deletedAt: { not: null, lt: cutoff },
      },
    })
  }

  // ── Categories CRUD ────────────────────────────────────────────────────

  async findCategories(userId: string) {
    return prisma.noteCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  async createDefaultCategories(userId: string): Promise<void> {
    const defaults = [
      { name: 'Personal', color: '#3B82F6', icon: 'user' },
      { name: 'Work', color: '#F59E0B', icon: 'briefcase' },
      { name: 'Ideas', color: '#8B5CF6', icon: 'lightbulb' },
    ]
    await prisma.noteCategory.createMany({
      data: defaults.map((cat) => ({ ...cat, userId })),
    })
  }

  async findCategoryById(userId: string, categoryId: string) {
    return prisma.noteCategory.findFirst({ where: { id: categoryId, userId } })
  }

  async findCategoryByName(userId: string, name: string, excludeId?: string) {
    const where: Record<string, unknown> = { userId, name }
    if (excludeId) where.id = { not: excludeId }
    return prisma.noteCategory.findFirst({ where })
  }

  async createCategory(
    userId: string,
    data: { name: string; color?: string; icon?: string },
  ) {
    return prisma.noteCategory.create({
      data: { userId, name: data.name, color: data.color, icon: data.icon },
    })
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    data: { name?: string; color?: string; icon?: string },
  ) {
    const existing = await prisma.noteCategory.findFirst({ where: { id: categoryId, userId } })
    if (!existing) return null

    return prisma.noteCategory.update({
      where: { id: categoryId },
      data: { name: data.name, color: data.color, icon: data.icon },
    })
  }

  async deleteCategory(userId: string, categoryId: string) {
    const existing = await prisma.noteCategory.findFirst({ where: { id: categoryId, userId } })
    if (!existing) return null

    // Unlink notes from this category before deleting
    await prisma.note.updateMany({
      where: { categoryId, userId },
      data: { categoryId: null },
    })

    return prisma.noteCategory.delete({ where: { id: categoryId } })
  }
}

export const notesRepository = new NotesRepository()
