import { readingRepo } from '../repositories/reading.repo'
import { gamificationEvents } from './gamification/events'

class ReadingService {
  async listBooks(
    userId: string,
    opts: {
      status?: string
      priority?: string
      plannedQuarter?: string
      favorite?: boolean
      search?: string
      limit: number
      offset: number
    },
  ) {
    const where: Record<string, unknown> = { userId }
    if (opts.status) where.status = opts.status
    if (opts.priority) where.priority = opts.priority
    if (opts.plannedQuarter) where.plannedQuarter = opts.plannedQuarter
    if (opts.favorite) where.favorite = true
    if (opts.search) {
      where.book = {
        OR: [
          { title: { contains: opts.search, mode: 'insensitive' } },
          { authors: { has: opts.search } },
        ],
      }
    }

    const [books, count] = await Promise.all([
      readingRepo.findManyUserBooks(where, { limit: opts.limit, offset: opts.offset }),
      readingRepo.countUserBooks(where),
    ])

    return { books, count }
  }

  async addBook(
    userId: string,
    body: {
      workKey: string
      editionKey?: string
      title: string
      subtitle?: string
      description?: string
      authors?: string[]
      coverUrl?: string
      pages?: number
      publishYear?: number
      language?: string
      subjects?: string[]
      isbnList?: string[]
      openLibraryUrl?: string
      status?: string
      priority?: string
      plannedQuarter?: string
    },
  ) {
    // 1. Upsert BookMaster
    let bookMaster = await readingRepo.findBookMasterByWorkKey(body.workKey)

    if (!bookMaster) {
      bookMaster = await readingRepo.createBookMaster({
        workKey: body.workKey,
        editionKey: body.editionKey || null,
        title: body.title,
        subtitle: body.subtitle || null,
        description: body.description || null,
        authors: body.authors || [],
        coverUrl: body.coverUrl || null,
        pages: body.pages || null,
        publishYear: body.publishYear || null,
        language: body.language || null,
        subjects: body.subjects || [],
        isbnList: body.isbnList || [],
        openLibraryUrl: body.openLibraryUrl || null,
      })
    }

    // 2. Check if user already has this book
    const existing = await readingRepo.findUserBookByBookId(userId, bookMaster.id)
    if (existing) {
      return { error: 'already_exists' as const, data: existing }
    }

    // 3. Create UserBook
    const userBook = await readingRepo.createUserBook({
      userId,
      bookId: bookMaster.id,
      status: body.status || 'to_read',
      priority: body.priority || 'medium',
      plannedQuarter: body.plannedQuarter || null,
      totalPagesSnapshot: body.pages || null,
    })

    return { data: userBook }
  }

  async getStats(userId: string) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)

    const [toRead, reading, completed, dnf, completedThisYear, favorites] = await Promise.all([
      readingRepo.countByStatus(userId, 'to_read'),
      readingRepo.countByStatus(userId, 'reading'),
      readingRepo.countByStatus(userId, 'completed'),
      readingRepo.countByStatus(userId, 'dnf'),
      readingRepo.countCompletedInRange(userId, yearStart, yearEnd),
      readingRepo.countFavorites(userId),
    ])

    return {
      toRead,
      reading,
      completed,
      dnf,
      completedThisYear,
      favorites,
    }
  }

  async getBook(userId: string, id: string) {
    return readingRepo.findUserBookByIdAndUser(id, userId)
  }

  async updateBook(userId: string, id: string, body: Record<string, unknown>) {
    const existing = await readingRepo.findUserBookOwnership(id, userId)
    if (!existing) return null

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.plannedQuarter !== undefined) updateData.plannedQuarter = body.plannedQuarter
    if (body.plannedStartDate !== undefined)
      updateData.plannedStartDate = body.plannedStartDate ? new Date(body.plannedStartDate as string) : null
    if (body.targetFinishDate !== undefined)
      updateData.targetFinishDate = body.targetFinishDate ? new Date(body.targetFinishDate as string) : null
    if (body.startedAt !== undefined)
      updateData.startedAt = body.startedAt ? new Date(body.startedAt as string) : null
    if (body.finishedAt !== undefined)
      updateData.finishedAt = body.finishedAt ? new Date(body.finishedAt as string) : null
    if (body.currentPage !== undefined) updateData.currentPage = body.currentPage
    if (body.totalPagesSnapshot !== undefined) updateData.totalPagesSnapshot = body.totalPagesSnapshot
    if (body.progressPercent !== undefined) updateData.progressPercent = body.progressPercent
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.review !== undefined) updateData.review = body.review
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.favorite !== undefined) updateData.favorite = body.favorite

    const updated = await readingRepo.updateUserBook(id, updateData)
    if (body.status === 'finished' && existing.status !== 'finished') {
      gamificationEvents.emit('book.finished', { userId, meta: { userBookId: id } })
    }
    return updated
  }

  async deleteBook(userId: string, id: string) {
    const existing = await readingRepo.findUserBookOwnership(id, userId)
    if (!existing) return false
    await readingRepo.deleteUserBook(id)
    return true
  }

  async listGoals(userId: string) {
    return readingRepo.findReadingGoals(userId)
  }

  async createGoal(
    userId: string,
    body: {
      periodType: string
      targetBooks: number
      startDate?: string
      endDate?: string
    },
  ) {
    return readingRepo.createReadingGoal({
      userId,
      periodType: body.periodType,
      targetBooks: body.targetBooks,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    })
  }

  async updateGoal(
    userId: string,
    id: string,
    body: { targetBooks: number; startDate?: string; endDate?: string },
  ) {
    const existing = await readingRepo.findReadingGoalByIdAndUser(id, userId)
    if (!existing) return null

    return readingRepo.updateReadingGoal(id, {
      targetBooks: body.targetBooks,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    })
  }

  async deleteGoal(userId: string, id: string) {
    const existing = await readingRepo.findReadingGoalByIdAndUser(id, userId)
    if (!existing) return false
    await readingRepo.deleteReadingGoal(id)
    return true
  }

  async searchOpenLibrary(query: string, limit: number, offset: number) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  }

  async getWorkFromOpenLibrary(key: string) {
    const url = `https://openlibrary.org/works/${key}.json`
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  }
}

export const readingService = new ReadingService()
