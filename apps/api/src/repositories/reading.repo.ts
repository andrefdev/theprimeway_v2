import { prisma } from '../lib/prisma'

class ReadingRepository {
  async findManyUserBooks(
    where: Record<string, unknown>,
    opts: { limit: number; offset: number },
  ) {
    return prisma.userBook.findMany({
      where,
      include: { book: true },
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: opts.offset,
    })
  }

  async countUserBooks(where: Record<string, unknown>) {
    return prisma.userBook.count({ where })
  }

  async findBookMasterByWorkKey(workKey: string) {
    return prisma.bookMaster.findFirst({ where: { workKey } })
  }

  async createBookMaster(data: {
    workKey: string
    editionKey: string | null
    title: string
    subtitle: string | null
    description: string | null
    authors: string[]
    coverUrl: string | null
    pages: number | null
    publishYear: number | null
    language: string | null
    subjects: string[]
    isbnList: string[]
    openLibraryUrl: string | null
  }) {
    return prisma.bookMaster.create({ data })
  }

  async findUserBookByBookId(userId: string, bookId: string) {
    return prisma.userBook.findFirst({ where: { userId, bookId } })
  }

  async createUserBook(data: Record<string, unknown>) {
    return prisma.userBook.create({
      data: data as any,
      include: { book: true },
    })
  }

  async countByStatus(userId: string, status: string) {
    return prisma.userBook.count({ where: { userId, status } })
  }

  async countCompletedInRange(userId: string, gte: Date, lte: Date) {
    return prisma.userBook.count({
      where: { userId, status: 'completed', finishedAt: { gte, lte } },
    })
  }

  async countFavorites(userId: string) {
    return prisma.userBook.count({ where: { userId, favorite: true } })
  }

  async findUserBookByIdAndUser(id: string, userId: string) {
    return prisma.userBook.findFirst({ where: { id, userId }, include: { book: true } })
  }

  async findUserBookOwnership(id: string, userId: string) {
    return prisma.userBook.findFirst({ where: { id, userId } })
  }

  async updateUserBook(id: string, data: Record<string, unknown>) {
    return prisma.userBook.update({
      where: { id },
      data: data as any,
      include: { book: true },
    })
  }

  async deleteUserBook(id: string) {
    return prisma.userBook.delete({ where: { id } })
  }

  async findReadingGoals(userId: string) {
    return prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createReadingGoal(data: {
    userId: string
    periodType: string
    targetBooks: number
    startDate: Date | null
    endDate: Date | null
  }) {
    return prisma.readingGoal.create({ data: data as any })
  }

  async findReadingGoalByIdAndUser(id: string, userId: string) {
    return prisma.readingGoal.findFirst({ where: { id, userId } })
  }

  async updateReadingGoal(id: string, data: Record<string, unknown>) {
    return prisma.readingGoal.update({ where: { id }, data: data as any })
  }

  async deleteReadingGoal(id: string) {
    return prisma.readingGoal.delete({ where: { id } })
  }
}

export const readingRepo = new ReadingRepository()
