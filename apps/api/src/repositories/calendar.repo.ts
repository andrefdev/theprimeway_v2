import { prisma } from '../lib/prisma'

class CalendarRepository {
  async findAccountsByUser(userId: string) {
    return prisma.calendarAccount.findMany({
      where: { userId },
      include: { calendars: true },
    })
  }

  async findAccountById(id: string) {
    return prisma.calendarAccount.findFirst({ where: { id } })
  }

  async deleteAccount(id: string) {
    return prisma.calendarAccount.delete({ where: { id } })
  }

  async findCalendarById(id: string) {
    return prisma.calendar.findFirst({ where: { id } })
  }

  async findAccountByCalendarAccountId(calendarAccountId: string) {
    return prisma.calendarAccount.findFirst({ where: { id: calendarAccountId } })
  }

  async updateCalendar(id: string, data: Record<string, unknown>) {
    return prisma.calendar.update({ where: { id }, data })
  }

  async findAccountByProviderEmail(userId: string, provider: string, providerEmail: string) {
    return prisma.calendarAccount.findFirst({
      where: { userId, provider, providerEmail } as any,
    })
  }

  async updateAccount(id: string, data: Record<string, unknown>) {
    return prisma.calendarAccount.update({ where: { id }, data })
  }

  async createAccount(data: {
    userId: string
    provider: string
    providerAccountId: string
    providerEmail: string
    displayName: string
    accessToken: string
    refreshToken: string | null
    tokenExpiresAt: Date
  }) {
    return prisma.calendarAccount.create({ data: data as any })
  }

  async upsertCalendar(
    calendarAccountId: string,
    externalId: string,
    updateData: { name: string; color: string | null | undefined },
    createData: {
      calendarAccountId: string
      externalId: string
      name: string
      color: string | null
      isPrimary: boolean
      isSelectedForSync: boolean
    },
  ) {
    return prisma.calendar.upsert({
      where: {
        calendarAccountId_externalId: { calendarAccountId, externalId },
      } as any,
      update: updateData,
      create: createData as any,
    })
  }

  async findGoogleAccountsWithSyncCalendars(userId: string) {
    return prisma.calendarAccount.findMany({
      where: { userId, provider: 'google' },
      include: { calendars: { where: { isSelectedForSync: true } } },
    })
  }

  async findGoogleAccountWithRefreshToken(userId: string) {
    return prisma.calendarAccount.findFirst({
      where: { userId, provider: 'google', refreshToken: { not: null } },
    })
  }

  async findAccountsWithSyncCalendars(userId: string) {
    return prisma.calendarAccount.findMany({
      where: { userId },
      include: { calendars: { where: { isSelectedForSync: true } } },
    })
  }

  async findAllUserAccountsWithCalendars(userId: string) {
    return prisma.calendarAccount.findMany({
      where: { userId },
      include: { calendars: true },
    })
  }
}

export const calendarRepo = new CalendarRepository()
