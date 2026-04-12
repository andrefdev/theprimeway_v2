import { calendarRepo } from '../repositories/calendar.repo'
import { prisma } from '../lib/prisma'

class CalendarService {
  async listAccounts(userId: string) {
    return calendarRepo.findAccountsByUser(userId)
  }

  async deleteAccount(userId: string, id: string) {
    const account = await calendarRepo.findAccountById(id)
    if (!account || account.userId !== userId) return null
    await calendarRepo.deleteAccount(id)
    return true
  }

  async updateCalendar(
    userId: string,
    id: string,
    body: { isSelectedForSync?: boolean; isPrimary?: boolean; color?: string },
  ) {
    const calendar = await calendarRepo.findCalendarById(id)
    if (!calendar) return { error: 'not_found' as const }

    const account = await calendarRepo.findAccountByCalendarAccountId(calendar.calendarAccountId)
    if (!account || account.userId !== userId) return { error: 'unauthorized' as const }

    const updateData: Record<string, unknown> = {}
    if (body.isSelectedForSync !== undefined) updateData.isSelectedForSync = body.isSelectedForSync
    if (body.isPrimary !== undefined) updateData.isPrimary = body.isPrimary
    if (body.color !== undefined) updateData.color = body.color

    // If setting isPrimary=true, unset all other primary calendars
    if (body.isPrimary === true) {
      const accounts = await calendarRepo.findAllUserAccountsWithCalendars(userId)
      for (const acc of accounts) {
        for (const cal of acc.calendars) {
          if (cal.isPrimary && cal.id !== id) {
            await calendarRepo.updateCalendar(cal.id, { isPrimary: false })
          }
        }
      }
    }

    return { data: await calendarRepo.updateCalendar(id, updateData) }
  }

  getGoogleOAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI

    if (!clientId || !redirectUri) return null

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ].join(' ')

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`
  }

  async handleGoogleCallback(userId: string, code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return { error: 'not_configured' as const }
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('[GOOGLE_CALLBACK] Token exchange failed:', errText)
      return { error: 'token_exchange_failed' as const }
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const userInfo = (await userInfoRes.json()) as { email: string; name?: string }

    // Upsert CalendarAccount
    const existingAccount = await calendarRepo.findAccountByProviderEmail(userId, 'google', userInfo.email)

    let account
    if (existingAccount) {
      account = await calendarRepo.updateAccount(existingAccount.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || existingAccount.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
    } else {
      account = await calendarRepo.createAccount({
        userId,
        provider: 'google',
        providerAccountId: userInfo.email,
        providerEmail: userInfo.email,
        displayName: userInfo.name || userInfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
    }

    // Fetch and store calendars from Google
    const calendarListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    )
    const calendarList = (await calendarListRes.json()) as {
      items?: Array<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }>
    }

    if (calendarList.items) {
      for (const cal of calendarList.items) {
        await calendarRepo.upsertCalendar(
          account.id,
          cal.id,
          { name: cal.summary, color: cal.backgroundColor },
          {
            calendarAccountId: account.id,
            externalId: cal.id,
            name: cal.summary,
            color: cal.backgroundColor || null,
            isPrimary: cal.primary || false,
            isSelectedForSync: cal.primary || false,
          },
        )
      }
    }

    return { data: account }
  }

  async getGoogleEvents(userId: string, timeMin: string, timeMax: string) {
    const accounts = await calendarRepo.findGoogleAccountsWithSyncCalendars(userId)
    const allEvents: unknown[] = []

    for (const account of accounts) {
      let accessToken = account.accessToken
      const acct = account as any

      // Refresh token if expired
      if (acct.tokenExpiresAt && new Date() >= acct.tokenExpiresAt && account.refreshToken) {
        const refreshed = await this.refreshGoogleToken(account.refreshToken)
        if (refreshed) {
          accessToken = refreshed.access_token
          await calendarRepo.updateAccount(account.id, {
            accessToken: refreshed.access_token,
            tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
          })
        }
      }

      for (const cal of account.calendars) {
        try {
          const calAny = cal as any
          const externalId = calAny.externalId || calAny.providerCalendarId
          const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(externalId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`

          const res = await fetch(eventsUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })

          if (res.ok) {
            const data = (await res.json()) as { items?: unknown[] }
            if (data.items) {
              allEvents.push(
                ...data.items.map((event: any) => ({
                  ...event,
                  calendarId: cal.id,
                  calendarName: cal.name,
                  calendarColor: cal.color,
                })),
              )
            }
          }
        } catch (err) {
          console.error(`[GOOGLE_EVENTS] Error fetching calendar ${cal.id}:`, err)
        }
      }
    }

    return allEvents
  }

  async importGoogleCalendar(userId: string) {
    return calendarRepo.findGoogleAccountWithRefreshToken(userId)
  }

  async syncCalendars(userId: string, calendarId?: string) {
    if (!calendarId) {
      const accounts = await calendarRepo.findAccountsWithSyncCalendars(userId)
      let totalSynced = 0
      for (const acc of accounts) {
        totalSynced += acc.calendars.length
      }
      return { success: true, count: totalSynced }
    }
    return { success: true, syncedCount: 0 }
  }

  async getFreeSlots(userId: string, date: string, duration: number) {
    // Get user's work preferences
    const workPrefs = await prisma.userWorkPreferences.findUnique({
      where: { userId },
    })

    if (!workPrefs) {
      return { error: 'no_work_preferences' as const }
    }

    // Parse date and create time bounds
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay()
    const timeZone = workPrefs.timeZone || 'UTC'

    // Check if this is a work day
    const workDays = (workPrefs.workDays as number[] | null) || [1, 2, 3, 4, 5] // Default: Mon-Fri
    if (!workDays.includes(dayOfWeek)) {
      return { freeSlots: [] }
    }

    // Create time range for the day in ISO format
    const dayStart = new Date(dateObj)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(dateObj)
    dayEnd.setUTCHours(23, 59, 59, 999)

    // Get all events for this day
    const events = await this.getGoogleEvents(userId, dayStart.toISOString(), dayEnd.toISOString())

    // Convert events to have start/end as Date objects
    const occupiedSlots = (events as any[])
      .filter((e) => e.start && e.end)
      .map((e) => ({
        start: new Date(typeof e.start === 'string' ? e.start : e.start.dateTime),
        end: new Date(typeof e.end === 'string' ? e.end : e.end.dateTime),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Generate free slots within work hours
    const workStartDate = new Date(dateObj)
    workStartDate.setUTCHours(workPrefs.workStartHour, 0, 0, 0)
    const workEndDate = new Date(dateObj)
    workEndDate.setUTCHours(workPrefs.workEndHour, 0, 0, 0)

    const freeSlots: Array<{ start: string; end: string; durationMinutes: number }> = []
    let currentTime = workStartDate

    for (const occupied of occupiedSlots) {
      // If there's a gap before this event
      if (currentTime < occupied.start) {
        const gapDuration = (occupied.start.getTime() - currentTime.getTime()) / (1000 * 60)
        if (gapDuration >= duration) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: occupied.start.toISOString(),
            durationMinutes: Math.floor(gapDuration),
          })
        }
      }
      currentTime = new Date(Math.max(currentTime.getTime(), occupied.end.getTime()))
    }

    // Check if there's free time after last event until work end
    if (currentTime < workEndDate) {
      const gapDuration = (workEndDate.getTime() - currentTime.getTime()) / (1000 * 60)
      if (gapDuration >= duration) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: workEndDate.toISOString(),
          durationMinutes: Math.floor(gapDuration),
        })
      }
    }

    return { freeSlots }
  }

  private async refreshGoogleToken(
    refreshToken: string,
  ): Promise<{ access_token: string; expires_in: number } | null> {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!res.ok) return null
      return res.json() as Promise<{ access_token: string; expires_in: number }>
    } catch {
      return null
    }
  }
}

export const calendarService = new CalendarService()
