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

  async findAccountByProviderEmail(userId: string, provider: string, email: string) {
    return prisma.calendarAccount.findFirst({
      where: { userId, provider, email },
    })
  }

  async updateAccount(id: string, data: Record<string, unknown>) {
    const mapped: Record<string, unknown> = { ...data }
    if ('tokenExpiresAt' in mapped) {
      mapped.expiresAt = mapped.tokenExpiresAt
      delete mapped.tokenExpiresAt
    }
    if ('providerEmail' in mapped) {
      mapped.email = mapped.providerEmail
      delete mapped.providerEmail
    }
    delete mapped.providerAccountId
    delete mapped.displayName
    return prisma.calendarAccount.update({ where: { id }, data: mapped })
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
    return prisma.calendarAccount.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        email: data.providerEmail,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.tokenExpiresAt,
      },
    })
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
    const existing = await prisma.calendar.findFirst({
      where: { calendarAccountId, providerCalendarId: externalId },
    })
    if (existing) {
      return prisma.calendar.update({
        where: { id: existing.id },
        data: { name: updateData.name, color: updateData.color ?? null },
      })
    }
    return prisma.calendar.create({
      data: {
        calendarAccountId: createData.calendarAccountId,
        providerCalendarId: createData.externalId,
        name: createData.name,
        color: createData.color,
        isPrimary: createData.isPrimary,
        isSelectedForSync: createData.isSelectedForSync,
      },
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

  async findTargetCalendarForUser(userId: string) {
    // Prefer the account.defaultTargetCalendarId if set; else fall back to primary
    // isSelectedForSync calendar of the first Google account.
    const accounts = await prisma.calendarAccount.findMany({
      where: { userId, provider: 'google' },
      include: { calendars: true },
    })
    if (!accounts.length) return null

    for (const acc of accounts) {
      const target = (acc as any).defaultTargetCalendarId
        ? acc.calendars.find((c: any) => c.id === (acc as any).defaultTargetCalendarId)
        : null
      if (target) return { account: acc, calendar: target }
    }

    for (const acc of accounts) {
      const primary = acc.calendars.find((c: any) => c.isPrimary && c.isSelectedForSync)
      if (primary) return { account: acc, calendar: primary }
      const anySync = acc.calendars.find((c: any) => c.isSelectedForSync)
      if (anySync) return { account: acc, calendar: anySync }
    }

    return null
  }
}

export const calendarRepo = new CalendarRepository()
