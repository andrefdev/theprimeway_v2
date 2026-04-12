/**
 * Notes Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Business rules (duplicate category check, soft delete, auto-purge, default categories)
 * - NO Prisma queries, NO HTTP concerns
 */
import { notesRepository } from '../repositories/notes.repo'
import { prisma } from '../lib/prisma'
import { validateLimit } from '../lib/limits'
import { FEATURES } from '@repo/shared/constants'
import type { FindNotesOptions } from '../repositories/notes.repo'
import type { Note, NoteCategory } from '@prisma/client'

type NoteModel = Note & { category?: NoteCategory | null }
type CategoryModel = NoteCategory

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateNoteInput {
  title: string
  content?: string
  categoryId?: string
  isPinned?: boolean
  isArchived?: boolean
  tags?: string[]
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  categoryId?: string | null
  isPinned?: boolean
  isArchived?: boolean
  isDeleted?: boolean
  tags?: string[]
}

export interface CreateCategoryInput {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  icon?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TRASH_RETENTION_DAYS = 30

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class NotesService {
  // ── Notes CRUD ─────────────────────────────────────────────────────────

  async listNotes(
    userId: string,
    options: FindNotesOptions,
  ): Promise<{ data: NoteModel[]; count: number }> {
    const { notes, count } = await notesRepository.findMany(userId, options)
    return { data: notes, count }
  }

  async getNote(userId: string, noteId: string): Promise<NoteModel | null> {
    return notesRepository.findById(userId, noteId)
  }

  async createNote(userId: string, input: CreateNoteInput): Promise<NoteModel> {
    // Check note limit
    const [subscription, usage] = await Promise.all([
      prisma.userSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      }),
      prisma.userUsageStat.findFirst({
        where: { userId },
      }),
    ])

    const plan = subscription?.plan
    if (plan) {
      validateLimit(FEATURES.NOTES_LIMIT, plan, usage?.currentNotes ?? 0)
    }

    return notesRepository.create(userId, {
      title: input.title,
      content: input.content,
      categoryId: input.categoryId,
      isPinned: input.isPinned,
      isArchived: input.isArchived,
      tags: input.tags,
    })
  }

  async updateNote(userId: string, noteId: string, input: UpdateNoteInput): Promise<NoteModel | null> {
    const data: Record<string, unknown> = {}
    if (input.title !== undefined) data.title = input.title
    if (input.content !== undefined) data.content = input.content
    if (input.categoryId !== undefined) data.categoryId = input.categoryId
    if (input.isPinned !== undefined) data.isPinned = input.isPinned
    if (input.isArchived !== undefined) data.isArchived = input.isArchived
    if (input.tags !== undefined) data.tags = input.tags

    // Soft-delete support via deletedAt
    if (input.isDeleted === true) {
      data.deletedAt = new Date()
    } else if (input.isDeleted === false) {
      data.deletedAt = null
    }

    return notesRepository.update(userId, noteId, data)
  }

  /** Soft-delete a note (move to trash) */
  async deleteNote(userId: string, noteId: string): Promise<NoteModel | null> {
    return notesRepository.softDelete(userId, noteId)
  }

  /** Restore a note from trash */
  async restoreNote(userId: string, noteId: string): Promise<NoteModel | null> {
    return notesRepository.restore(userId, noteId)
  }

  // ── Trash ──────────────────────────────────────────────────────────────

  /** List trashed notes (auto-purges expired notes first) */
  async listTrash(userId: string): Promise<{ data: NoteModel[]; count: number }> {
    await notesRepository.purgeExpiredNotes(userId, TRASH_RETENTION_DAYS)

    const { notes, count } = await notesRepository.findTrashed(userId)
    return { data: notes, count }
  }

  /** Permanently delete all trashed notes */
  async emptyTrash(userId: string): Promise<number> {
    return notesRepository.emptyTrash(userId)
  }

  // ── Categories ─────────────────────────────────────────────────────────

  /** List categories, creating defaults if none exist */
  async listCategories(userId: string): Promise<CategoryModel[]> {
    let categories = await notesRepository.findCategories(userId)

    if (categories.length === 0) {
      await notesRepository.createDefaultCategories(userId)
      categories = await notesRepository.findCategories(userId)
    }

    return categories
  }

  async getCategory(userId: string, categoryId: string): Promise<CategoryModel | null> {
    return notesRepository.findCategoryById(userId, categoryId)
  }

  /** Create a category with duplicate name check */
  async createCategory(
    userId: string,
    input: CreateCategoryInput,
  ): Promise<{ category?: CategoryModel; duplicate?: boolean }> {
    const existing = await notesRepository.findCategoryByName(userId, input.name)
    if (existing) return { duplicate: true }

    const category = await notesRepository.createCategory(userId, input)
    return { category }
  }

  /** Update a category with duplicate name check */
  async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateCategoryInput,
  ): Promise<{ category?: CategoryModel; notFound?: boolean; duplicate?: boolean }> {
    // Check existence
    const existing = await notesRepository.findCategoryById(userId, categoryId)
    if (!existing) return { notFound: true }

    // Check duplicate name
    if (input.name) {
      const duplicate = await notesRepository.findCategoryByName(userId, input.name, categoryId)
      if (duplicate) return { duplicate: true }
    }

    const category = await notesRepository.updateCategory(userId, categoryId, input)
    if (!category) return { notFound: true }
    return { category }
  }

  /** Delete a category (unlinks notes first) */
  async deleteCategory(
    userId: string,
    categoryId: string,
  ): Promise<CategoryModel | null> {
    return notesRepository.deleteCategory(userId, categoryId)
  }
}

export const notesService = new NotesService()
