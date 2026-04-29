import { calendarRepo } from '../repositories/calendar.repo'
import { tasksRepository } from '../repositories/tasks.repo'
import { prisma } from '../lib/prisma'
import { generateObject } from 'ai'
import { taskModel } from '../lib/ai-models'
import { z } from 'zod'

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

  async updateAccountSettings(
    userId: string,
    id: string,
    body: { defaultTargetCalendarId?: string | null },
  ) {
    const account = await calendarRepo.findAccountById(id)
    if (!account || account.userId !== userId) return null
    const updateData: Record<string, unknown> = {}
    if (body.defaultTargetCalendarId !== undefined) {
      updateData.defaultTargetCalendarId = body.defaultTargetCalendarId
    }
    if (!Object.keys(updateData).length) return account
    return calendarRepo.updateAccount(id, updateData)
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
    const clientId = process.env.AUTH_GOOGLE_ID
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI

    if (!clientId || !redirectUri) return null

    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ')

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=calendar_oauth`
  }

  async handleGoogleCallback(userId: string, code: string) {
    const clientId = process.env.AUTH_GOOGLE_ID
    const clientSecret = process.env.AUTH_GOOGLE_SECRET
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return { error: 'not_configured' as const, detail: 'AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET or GOOGLE_CALENDAR_REDIRECT_URI missing' }
    }

    try {
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
        return { error: 'token_exchange_failed' as const, detail: errText }
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string
        refresh_token?: string
        expires_in: number
      }
      console.log('[GOOGLE_CALLBACK] token exchange OK')

      // Get user info from Google. If userinfo scope wasn't granted, fall back
      // to the calendar primary id (which is the user's email for Google).
      let userInfo: { email?: string; name?: string } = {}
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (userInfoRes.ok) {
        userInfo = (await userInfoRes.json()) as { email?: string; name?: string }
        console.log('[GOOGLE_CALLBACK] userinfo OK', userInfo.email)
      } else {
        const errText = await userInfoRes.text()
        console.warn('[GOOGLE_CALLBACK] userinfo failed, will fall back to primary calendar id:', errText)
      }

      if (!userInfo.email) {
        const primaryRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary',
          { headers: { Authorization: `Bearer ${tokens.access_token}` } },
        )
        if (primaryRes.ok) {
          const primary = (await primaryRes.json()) as { id?: string; summary?: string }
          if (primary.id) {
            userInfo = { email: primary.id, name: primary.summary }
            console.log('[GOOGLE_CALLBACK] derived email from primary calendar', primary.id)
          }
        } else {
          const errText = await primaryRes.text()
          console.error('[GOOGLE_CALLBACK] primary calendar fallback failed:', errText)
        }
      }

      if (!userInfo.email) {
        return {
          error: 'userinfo_no_email' as const,
          detail: 'Could not determine Google account email from userinfo or primary calendar',
        }
      }

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
      console.log('[GOOGLE_CALLBACK] account upsert OK', account.id)

      // Fetch and store calendars from Google
      const calendarListRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      )
      if (!calendarListRes.ok) {
        const errText = await calendarListRes.text()
        console.error('[GOOGLE_CALLBACK] calendarList failed:', errText)
        return { error: 'calendar_list_failed' as const, detail: errText }
      }
      const calendarList = (await calendarListRes.json()) as {
        items?: Array<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }>
      }

      const upsertedCalendars: Array<{ id: string; isSelectedForSync: boolean | null | undefined }> = []
      if (calendarList.items) {
        for (const cal of calendarList.items) {
          const upserted = await calendarRepo.upsertCalendar(
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
          upsertedCalendars.push({ id: upserted.id, isSelectedForSync: upserted.isSelectedForSync })
        }
      }
      console.log('[GOOGLE_CALLBACK] calendars upserted', upsertedCalendars.length)

      // Subscribe push-notification watch channels for synced calendars (fire-and-forget)
      for (const cal of upsertedCalendars) {
        if (cal.isSelectedForSync) {
          this.subscribeWatchChannel(cal.id).catch((err) =>
            console.error('[CAL_WATCH] subscribe on connect failed', err),
          )
        }
      }

      return { data: account }
    } catch (err) {
      console.error('[GOOGLE_CALLBACK] unexpected error', err)
      return { error: 'callback_failed' as const, detail: (err as Error)?.message ?? String(err) }
    }
  }

  async getGoogleEvents(userId: string, timeMin: string, timeMax: string) {
    const accounts = await calendarRepo.findGoogleAccountsWithSyncCalendars(userId)
    const allEvents: unknown[] = []

    for (const account of accounts) {
      let accessToken = account.accessToken
      const acct = account as any

      // Refresh token if expired
      if (acct.expiresAt && new Date() >= new Date(acct.expiresAt) && account.refreshToken) {
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
    // Get user's working hours (per-weekday rows; channelId=null = default)
    const workingHoursRows = await prisma.workingHours.findMany({
      where: { userId, channelId: null },
    })

    if (workingHoursRows.length === 0) {
      return { error: 'no_work_preferences' as const }
    }

    // Parse date and create time bounds
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay()

    // Check if this is a work day
    const todayRow = workingHoursRows.find((r: { dayOfWeek: number }) => r.dayOfWeek === dayOfWeek)
    if (!todayRow) {
      return { freeSlots: [] }
    }
    const workStartHour = parseInt(todayRow.startTime.split(':')[0] ?? '9', 10)
    const workEndHour = parseInt(todayRow.endTime.split(':')[0] ?? '17', 10)
    const workPrefs = { workStartHour, workEndHour }

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

  async analyzeFreeTime(
    userId: string,
    startDate: string,
    endDate: string,
    workStartHour = 8,
    workEndHour = 22,
  ) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Fetch all events for the entire range in one call
    const rangeStart = new Date(start)
    rangeStart.setUTCHours(0, 0, 0, 0)
    const rangeEnd = new Date(end)
    rangeEnd.setUTCHours(23, 59, 59, 999)

    const allEvents = (await this.getGoogleEvents(
      userId,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
    )) as Array<{ start?: any; end?: any }>

    const totalWorkMinutesPerDay = (workEndHour - workStartHour) * 60

    const days: Array<{
      date: string
      totalFreeMinutes: number
      totalBusyMinutes: number
      longestFreeBlock: number
      freeSlots: Array<{ start: string; end: string; durationMinutes: number }>
      eventCount: number
    }> = []

    // Iterate over each day in the range
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]!
      const dayStart = new Date(`${dateStr}T${String(workStartHour).padStart(2, '0')}:00:00Z`)
      const dayEnd = new Date(`${dateStr}T${String(workEndHour).padStart(2, '0')}:00:00Z`)

      // Filter events that overlap with this day's working hours
      const dayEvents = allEvents
        .filter((e) => e.start && e.end)
        .map((e) => {
          const eStart = new Date(typeof e.start === 'string' ? e.start : e.start.dateTime || e.start.date)
          const eEnd = new Date(typeof e.end === 'string' ? e.end : e.end.dateTime || e.end.date)
          return {
            start: eStart < dayStart ? dayStart : eStart,
            end: eEnd > dayEnd ? dayEnd : eEnd,
          }
        })
        .filter((e) => e.start < dayEnd && e.end > dayStart)
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      // Merge overlapping events
      const merged: Array<{ start: Date; end: Date }> = []
      for (const ev of dayEvents) {
        const last = merged[merged.length - 1]
        if (last && ev.start <= last.end) {
          last.end = ev.end > last.end ? ev.end : last.end
        } else {
          merged.push({ start: new Date(ev.start), end: new Date(ev.end) })
        }
      }

      // Calculate free slots from gaps between merged events
      const freeSlots: Array<{ start: string; end: string; durationMinutes: number }> = []
      let cursor = dayStart
      let longestFreeBlock = 0

      for (const occupied of merged) {
        if (cursor < occupied.start) {
          const durationMinutes = Math.floor((occupied.start.getTime() - cursor.getTime()) / 60000)
          freeSlots.push({
            start: cursor.toISOString(),
            end: occupied.start.toISOString(),
            durationMinutes,
          })
          if (durationMinutes > longestFreeBlock) longestFreeBlock = durationMinutes
        }
        cursor = new Date(Math.max(cursor.getTime(), occupied.end.getTime()))
      }

      // Gap after last event
      if (cursor < dayEnd) {
        const durationMinutes = Math.floor((dayEnd.getTime() - cursor.getTime()) / 60000)
        freeSlots.push({
          start: cursor.toISOString(),
          end: dayEnd.toISOString(),
          durationMinutes,
        })
        if (durationMinutes > longestFreeBlock) longestFreeBlock = durationMinutes
      }

      const totalFreeMinutes = freeSlots.reduce((sum, s) => sum + s.durationMinutes, 0)

      days.push({
        date: dateStr,
        totalFreeMinutes,
        totalBusyMinutes: totalWorkMinutesPerDay - totalFreeMinutes,
        longestFreeBlock,
        freeSlots,
        eventCount: dayEvents.length,
      })

      current.setDate(current.getDate() + 1)
    }

    // Build summary
    const avgFreeMinutesPerDay = days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.totalFreeMinutes, 0) / days.length)
      : 0

    let busiestDay = days[0]?.date ?? startDate
    let freestDay = days[0]?.date ?? startDate
    let minFree = days[0]?.totalFreeMinutes ?? 0
    let maxFree = days[0]?.totalFreeMinutes ?? 0

    for (const d of days) {
      if (d.totalFreeMinutes < minFree) { minFree = d.totalFreeMinutes; busiestDay = d.date }
      if (d.totalFreeMinutes > maxFree) { maxFree = d.totalFreeMinutes; freestDay = d.date }
    }

    const totalFreeHours = Math.round(days.reduce((s, d) => s + d.totalFreeMinutes, 0) / 60 * 10) / 10

    return {
      days,
      summary: { avgFreeMinutesPerDay, busiestDay, freestDay, totalFreeHours },
    }
  }

  async createTimeBlock(
    userId: string,
    input: {
      title: string
      date: string
      startTime: string
      endTime: string
      description?: string
      color?: string
      timeZone?: string
      location?: string
      attendees?: { email: string }[]
      reminders?: {
        useDefault: boolean
        overrides?: { method: 'popup' | 'email'; minutes: number }[]
      }
      addGoogleMeet?: boolean
      calendarId?: string
    },
  ): Promise<{
    success: boolean
    eventId?: string
    hangoutLink?: string
    htmlLink?: string
    error?: string
  }> {
    // Get the user's primary Google Calendar account
    const accounts = await calendarRepo.findGoogleAccountsWithSyncCalendars(userId)
    if (!accounts.length) return { success: false, error: 'no_google_account' }

    const account = accounts[0]!
    let accessToken = account.accessToken

    // Refresh token if needed
    const acct = account as any
    if (acct.expiresAt && new Date() >= new Date(acct.expiresAt) && account.refreshToken) {
      const refreshed = await this.refreshGoogleToken(account.refreshToken)
      if (refreshed) {
        accessToken = refreshed.access_token
        await calendarRepo.updateAccount(account.id, {
          accessToken: refreshed.access_token,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
      }
    }

    // Pick calendar — caller can specify, otherwise primary
    let targetCalendarId = input.calendarId
    if (!targetCalendarId) {
      const primaryCal = account.calendars.find((c: any) => c.isPrimary) || account.calendars[0]
      if (!primaryCal) return { success: false, error: 'no_calendar' }
      const calAny = primaryCal as any
      targetCalendarId = calAny.externalId || calAny.providerCalendarId
    }

    // Create the event
    const startDateTime = `${input.date}T${input.startTime}:00`
    const endDateTime = `${input.date}T${input.endTime}:00`

    const tz = input.timeZone || 'UTC'
    const eventBody: Record<string, unknown> = {
      summary: input.title,
      description: input.description || 'Time block created by ThePrimeWay',
      start: { dateTime: startDateTime, timeZone: tz },
      end: { dateTime: endDateTime, timeZone: tz },
      colorId: input.color || '9', // Blueberry
    }
    if (input.location) eventBody.location = input.location
    if (input.attendees?.length) eventBody.attendees = input.attendees
    if (input.reminders) eventBody.reminders = input.reminders
    if (input.addGoogleMeet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolution: { key: { type: 'hangoutsMeet' } },
        },
      }
    }

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId!)}/events`,
    )
    if (input.addGoogleMeet) url.searchParams.set('conferenceDataVersion', '1')

    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      })

      if (!res.ok) {
        const error = await res.text()
        console.error('[TIME_BLOCK] Failed to create event:', error)
        return { success: false, error: 'event_creation_failed' }
      }

      const event = (await res.json()) as {
        id: string
        hangoutLink?: string
        htmlLink?: string
      }
      return {
        success: true,
        eventId: event.id,
        hangoutLink: event.hangoutLink,
        htmlLink: event.htmlLink,
      }
    } catch (err) {
      console.error('[TIME_BLOCK] Error:', err)
      return { success: false, error: 'event_creation_failed' }
    }
  }

  // -------------------------------------------------------------------------
  // Generic Google Event mutations (for arbitrary events, not Task-bound)
  // -------------------------------------------------------------------------

  /**
   * Verify the given calendarId belongs to the user and return an access token
   * for the owning account. Returns null if calendar not found for user.
   */
  private async resolveCalendarForUser(
    userId: string,
    calendarId: string,
  ): Promise<{ accessToken: string; calendar: any; account: any } | null> {
    const accounts = await calendarRepo.findGoogleAccountsWithSyncCalendars(userId)
    for (const account of accounts) {
      const cal = (account.calendars as any[]).find(
        (c) => (c.providerCalendarId || c.externalId) === calendarId,
      )
      if (cal) {
        let accessToken = account.accessToken!
        const acct = account as any
        if (acct.expiresAt && new Date() >= new Date(acct.expiresAt) && account.refreshToken) {
          const refreshed = await this.refreshGoogleToken(account.refreshToken)
          if (refreshed) {
            accessToken = refreshed.access_token
            await calendarRepo.updateAccount(account.id, {
              accessToken: refreshed.access_token,
              tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
            })
          }
        }
        return { accessToken, calendar: cal, account }
      }
    }
    return null
  }

  async getGoogleEvent(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    const ctx = await this.resolveCalendarForUser(userId, calendarId)
    if (!ctx) return { success: false, error: 'not_found' }
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        { headers: { Authorization: `Bearer ${ctx.accessToken}` } },
      )
      if (!res.ok) {
        return { success: false, error: `google_${res.status}` }
      }
      const event = await res.json()
      return { success: true, event }
    } catch (err) {
      console.error('[GET_EVENT] Error:', err)
      return { success: false, error: 'network_error' }
    }
  }

  async updateGoogleEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    patch: {
      title?: string
      description?: string
      location?: string
      date?: string
      startTime?: string
      endTime?: string
      timeZone?: string
      colorId?: string
      attendees?: { email: string }[]
      addGoogleMeet?: boolean
      removeGoogleMeet?: boolean
      reminders?: {
        useDefault: boolean
        overrides?: { method: 'popup' | 'email'; minutes: number }[]
      }
      visibility?: 'default' | 'public' | 'private' | 'confidential'
    },
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    const ctx = await this.resolveCalendarForUser(userId, calendarId)
    if (!ctx) return { success: false, error: 'not_found' }

    const body: Record<string, unknown> = {}
    if (patch.title !== undefined) body.summary = patch.title
    if (patch.description !== undefined) body.description = patch.description
    if (patch.location !== undefined) body.location = patch.location
    if (patch.colorId !== undefined) body.colorId = patch.colorId
    if (patch.attendees !== undefined) body.attendees = patch.attendees
    if (patch.reminders !== undefined) body.reminders = patch.reminders
    if (patch.visibility !== undefined) body.visibility = patch.visibility

    if (patch.date && patch.startTime && patch.endTime) {
      const tz = patch.timeZone || 'UTC'
      body.start = { dateTime: `${patch.date}T${patch.startTime}:00`, timeZone: tz }
      body.end = { dateTime: `${patch.date}T${patch.endTime}:00`, timeZone: tz }
    }

    let needsConferenceVersion = false
    if (patch.addGoogleMeet) {
      body.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolution: { key: { type: 'hangoutsMeet' } },
        },
      }
      needsConferenceVersion = true
    } else if (patch.removeGoogleMeet) {
      body.conferenceData = null
      needsConferenceVersion = true
    }

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    )
    if (needsConferenceVersion) url.searchParams.set('conferenceDataVersion', '1')

    try {
      const res = await fetch(url.toString(), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error('[UPDATE_EVENT] Failed:', errText)
        return { success: false, error: 'event_update_failed' }
      }
      const event = await res.json()
      return { success: true, event }
    } catch (err) {
      console.error('[UPDATE_EVENT] Error:', err)
      return { success: false, error: 'network_error' }
    }
  }

  async deleteGoogleEvent(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const ctx = await this.resolveCalendarForUser(userId, calendarId)
    if (!ctx) return { success: false, error: 'not_found' }
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${ctx.accessToken}` },
        },
      )
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        const errText = await res.text()
        console.error('[DELETE_EVENT] Failed:', errText)
        return { success: false, error: 'event_delete_failed' }
      }
      return { success: true }
    } catch (err) {
      console.error('[DELETE_EVENT] Error:', err)
      return { success: false, error: 'network_error' }
    }
  }

  async createHabitBlock(
    userId: string,
    input: {
      habitId: string
      habitName: string
      startTime: string
      endTime: string
      frequencyType: string
      weekDays?: string[]
      description?: string
      color?: string
    },
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    // Get the user's primary Google Calendar account
    const accounts = await calendarRepo.findGoogleAccountsWithSyncCalendars(userId)
    if (!accounts.length) return { success: false, error: 'no_google_account' }

    const account = accounts[0]!
    let accessToken = account.accessToken

    // Refresh token if needed
    const acct = account as any
    if (acct.expiresAt && new Date() >= new Date(acct.expiresAt) && account.refreshToken) {
      const refreshed = await this.refreshGoogleToken(account.refreshToken)
      if (refreshed) {
        accessToken = refreshed.access_token
        await calendarRepo.updateAccount(account.id, {
          accessToken: refreshed.access_token,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
      }
    }

    // Find primary calendar
    const primaryCal = account.calendars.find((c: any) => c.isPrimary) || account.calendars[0]
    if (!primaryCal) return { success: false, error: 'no_calendar' }

    const calAny = primaryCal as any
    const calendarId = calAny.externalId || calAny.providerCalendarId

    // Build RRULE based on frequency
    let rrule = ''
    if (input.frequencyType === 'daily') {
      rrule = 'RRULE:FREQ=DAILY'
    } else if (input.frequencyType === 'weekly' && input.weekDays?.length) {
      rrule = `RRULE:FREQ=WEEKLY;BYDAY=${input.weekDays.join(',')}`
    } else {
      rrule = 'RRULE:FREQ=DAILY'
    }

    // Start from tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const colorMap: Record<string, string> = {
      tomato: '11', flamingo: '4', tangerine: '6', banana: '5',
      sage: '2', basil: '10', peacock: '7', blueberry: '9',
      lavender: '1', grape: '3', graphite: '8',
    }

    const eventBody: Record<string, unknown> = {
      summary: `🔄 ${input.habitName}`,
      description: input.description || `Habit: ${input.habitName}`,
      start: { dateTime: `${dateStr}T${input.startTime}:00`, timeZone: 'America/New_York' },
      end: { dateTime: `${dateStr}T${input.endTime}:00`, timeZone: 'America/New_York' },
      recurrence: [rrule],
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] },
    }

    if (input.color && colorMap[input.color]) {
      eventBody.colorId = colorMap[input.color]
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        },
      )

      if (!res.ok) {
        const error = await res.text()
        console.error('[CALENDAR_HABIT_BLOCK] Failed to create recurring event:', error)
        return { success: false, error: 'event_creation_failed' }
      }

      const event = (await res.json()) as { id: string }
      return { success: true, eventId: event.id }
    } catch (err) {
      console.error('[CALENDAR_HABIT_BLOCK] Error:', err)
      return { success: false, error: 'event_creation_failed' }
    }
  }

  async generateTimeBlocks(userId: string, date: string) {
    // 1. Fetch user's working hours for scheduling bounds
    const dow = new Date(date).getDay()
    const todayRow = await prisma.workingHours.findFirst({
      where: { userId, channelId: null, dayOfWeek: dow },
    })
    const workStartHour = todayRow ? parseInt(todayRow.startTime.split(':')[0] ?? '9', 10) : 9
    const workEndHour = todayRow ? parseInt(todayRow.endTime.split(':')[0] ?? '17', 10) : 17

    // 2. Fetch pending/in-progress tasks for the date (scheduled or due)
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const allOpenTasks = await tasksRepository.findMany(userId, {
      status: 'open',
      archivedAt: null,
    })

    // Include tasks scheduled for this date, due on this date, or unscheduled
    const candidateTasks = allOpenTasks.filter((t: any) => {
      const scheduled = t.scheduledDate ? new Date(t.scheduledDate) : null
      const due = t.dueDate ? new Date(t.dueDate) : null

      if (scheduled && scheduled >= dayStart && scheduled <= dayEnd) return true
      if (due && due >= dayStart && due <= dayEnd) return true
      if (!scheduled && !due) return true // backlog tasks are candidates
      return false
    })

    // 3. Fetch existing Google Calendar events for the date
    const existingEvents = await this.getGoogleEvents(
      userId,
      dayStart.toISOString(),
      dayEnd.toISOString(),
    )

    const eventsText = (existingEvents as any[])
      .filter((e) => e.start && e.end)
      .map((e: any) => {
        const start = typeof e.start === 'string' ? e.start : e.start?.dateTime || e.start?.date
        const end = typeof e.end === 'string' ? e.end : e.end?.dateTime || e.end?.date
        return `- "${e.summary || 'Untitled'}" from ${start} to ${end}`
      })
      .join('\n')

    const tasksText = candidateTasks
      .map((t: any) => {
        const duration = t.estimatedDurationMinutes ?? 30
        const tags = Array.isArray(t.tags) ? (t.tags as string[]).join(', ') : ''
        return `- [${t.id}] "${t.title}" | priority: ${t.priority || 'medium'} | estimated: ${duration} min | tags: ${tags || 'none'} | due: ${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'none'}`
      })
      .join('\n')

    if (!candidateTasks.length) {
      return { blocks: [], unscheduled: [] }
    }

    // 4. AI generates optimal time-block schedule
    const timeBlockSchema = z.object({
      blocks: z.array(
        z.object({
          taskId: z.string().describe('Exact task ID from the list'),
          taskTitle: z.string().describe('Task title for display'),
          startTime: z.string().describe('Start time in HH:MM format (24h)'),
          endTime: z.string().describe('End time in HH:MM format (24h)'),
          reason: z.string().describe('Brief reason for this time slot'),
        }),
      ).describe('Scheduled time blocks for the day'),
      unscheduled: z.array(
        z.object({
          taskId: z.string().describe('Exact task ID from the list'),
          taskTitle: z.string().describe('Task title for display'),
          reason: z.string().describe('Why this task could not be scheduled'),
        }),
      ).describe('Tasks that could not fit into the schedule'),
    })

    const result = await generateObject({
      model: taskModel,
      schema: timeBlockSchema,
      prompt: `You are a productivity scheduling assistant for ThePrimeWay. Analyze the user's tasks and existing calendar events, then generate an optimal time-block schedule for the day.

DATE: ${date}
WORK HOURS: ${String(workStartHour).padStart(2, '0')}:00 to ${String(workEndHour).padStart(2, '0')}:00

EXISTING CALENDAR EVENTS (do NOT overlap with these):
${eventsText || '(No existing events)'}

TASKS TO SCHEDULE:
${tasksText}

SCHEDULING RULES:
1. NEVER overlap with existing calendar events.
2. Place high-priority tasks in morning slots when energy is highest.
3. Group tasks with similar tags/topics together when possible.
4. Include 5-10 minute breaks between blocks.
5. Respect the estimated duration of each task (use 30 min if not specified).
6. If a task cannot fit in the remaining available time, add it to the unscheduled list with a reason.
7. Use 24-hour HH:MM format for all times (e.g., "09:00", "14:30").
8. Return the EXACT task IDs from the list — do not invent new ones.
9. Order blocks chronologically from earliest to latest.
10. Leave buffer time around existing events (at least 5 minutes).`,
    })

    return result.object
  }

  async findSmartSlots(userId: string, taskId: string, date: string) {
    // 1. Fetch the task details
    const task = await tasksRepository.findById(userId, taskId)
    if (!task) {
      return { error: 'task_not_found' as const }
    }

    // 2. Fetch Google Calendar events for the date
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)
    const events = await this.getGoogleEvents(userId, dayStart.toISOString(), dayEnd.toISOString())

    const eventsText = (events as any[])
      .filter((e) => e.start && e.end)
      .map((e: any) => {
        const start = typeof e.start === 'string' ? e.start : e.start?.dateTime || e.start?.date
        const end = typeof e.end === 'string' ? e.end : e.end?.dateTime || e.end?.date
        return `- "${e.summary || 'Untitled'}" from ${start} to ${end}`
      })
      .join('\n')

    // 3. Fetch user's recent completed tasks with actualStart for productivity patterns
    const completedTasks = await tasksRepository.findCompletedWithActualStart(userId, 50)

    const productivityData = completedTasks
      .filter((t) => t.actualStart)
      .map((t) => {
        const startHour = new Date(t.actualStart!).getUTCHours()
        const duration = t.actualDurationMinutes ?? t.estimatedDurationMinutes ?? 30
        return { hour: startHour, priority: t.priority, tags: t.tags, duration }
      })

    // Build hour-frequency map for productivity pattern summary
    const hourCounts: Record<number, number> = {}
    for (const entry of productivityData) {
      hourCounts[entry.hour] = (hourCounts[entry.hour] || 0) + 1
    }
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([hour, count]) => `${String(hour).padStart(2, '0')}:00 (${count} tasks)`)
      .slice(0, 5)

    const productivitySummary = sortedHours.length > 0
      ? `Most productive hours (by completed task count): ${sortedHours.join(', ')}`
      : 'No historical productivity data available.'

    // 4. Fetch working hours for scheduling bounds
    const dow = new Date(date).getDay()
    const todayRow = await prisma.workingHours.findFirst({
      where: { userId, channelId: null, dayOfWeek: dow },
    })
    const workStartHour = todayRow ? parseInt(todayRow.startTime.split(':')[0] ?? '9', 10) : 9
    const workEndHour = todayRow ? parseInt(todayRow.endTime.split(':')[0] ?? '17', 10) : 17

    // 5. Build task info
    const taskDuration = (task as any).estimatedDurationMinutes ?? 30
    const taskTags = Array.isArray((task as any).tags) ? ((task as any).tags as string[]).join(', ') : ''

    // 6. AI generates smart slot suggestions
    const smartSlotsSchema = z.object({
      slots: z.array(
        z.object({
          startTime: z.string().describe('Start time in ISO 8601 format (e.g., 2026-04-14T09:00:00Z)'),
          endTime: z.string().describe('End time in ISO 8601 format (e.g., 2026-04-14T10:00:00Z)'),
          score: z.number().min(0).max(100).describe('Score from 0-100 indicating how optimal this slot is'),
          reason: z.string().describe('Brief explanation of why this slot is recommended'),
        }),
      ).describe('Ranked time slot suggestions, best first'),
      bestSlot: z.object({
        startTime: z.string().describe('Start time in ISO 8601 format'),
        endTime: z.string().describe('End time in ISO 8601 format'),
        reason: z.string().describe('Why this is the best slot for this task'),
      }).describe('The single best recommended slot'),
    })

    const result = await generateObject({
      model: taskModel,
      schema: smartSlotsSchema,
      prompt: `You are a smart scheduling assistant for ThePrimeWay. Find the optimal time slots for a specific task based on calendar availability, task characteristics, and the user's historical productivity patterns.

DATE: ${date}
WORK HOURS: ${String(workStartHour).padStart(2, '0')}:00 to ${String(workEndHour).padStart(2, '0')}:00

TASK TO SCHEDULE:
- Title: "${task.title}"
- Priority: ${(task as any).priority || 'medium'}
- Estimated duration: ${taskDuration} minutes
- Tags: ${taskTags || 'none'}

EXISTING CALENDAR EVENTS (must NOT overlap):
${eventsText || '(No existing events)'}

USER PRODUCTIVITY PATTERNS:
${productivitySummary}
Total completed tasks analyzed: ${productivityData.length}

SCHEDULING GUIDELINES:
1. Find 3-5 available time slots that fit the task's duration within work hours.
2. Score each slot from 0-100 based on:
   - Calendar availability (no overlaps with existing events)
   - Task priority: high-priority tasks score better in morning slots when focus is highest
   - Creative/deep-work tasks: score better in mid-morning or early afternoon
   - Routine/administrative tasks: can go in any slot, slightly prefer afternoon
   - User's historical patterns: slots during the user's most productive hours score higher
   - Buffer time: slots with natural breaks before/after events score slightly higher
3. Rank slots from highest to lowest score.
4. The bestSlot should be the slot with the highest score.
5. Use ISO 8601 datetime format for all times (e.g., "${date}T09:00:00Z").
6. Each slot must accommodate the full estimated duration of ${taskDuration} minutes.
7. Leave at least 5 minutes buffer around existing events.
8. Do not suggest slots outside work hours.`,
    })

    return result.object
  }

  // ---- Task ↔ Google Calendar bidirectional sync --------------------------

  /**
   * Ensure we have a fresh access token for the given account.
   * Mutates the DB if a refresh happens.
   */
  private async ensureAccessToken(accountId: string): Promise<string | null> {
    const account = await prisma.calendarAccount.findUnique({ where: { id: accountId } })
    if (!account?.accessToken) return null

    const expired = account.expiresAt && new Date() >= account.expiresAt
    if (!expired) return account.accessToken
    if (!account.refreshToken) return account.accessToken // best-effort

    const refreshed = await this.refreshGoogleToken(account.refreshToken)
    if (!refreshed) return account.accessToken

    await prisma.calendarAccount.update({
      where: { id: accountId },
      data: {
        accessToken: refreshed.access_token,
        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    })
    return refreshed.access_token
  }

  private buildEventBody(task: {
    title: string
    description?: string | null
    scheduledStart?: Date | null
    scheduledEnd?: Date | null
    scheduledDate?: Date | null
    isAllDay?: boolean | null
  }) {
    const body: Record<string, unknown> = {
      summary: task.title,
      description: task.description || 'Task synced from ThePrimeWay',
    }

    if (task.isAllDay && task.scheduledDate) {
      const date = task.scheduledDate.toISOString().split('T')[0]!
      const next = new Date(task.scheduledDate)
      next.setUTCDate(next.getUTCDate() + 1)
      const nextDate = next.toISOString().split('T')[0]!
      body.start = { date }
      body.end = { date: nextDate }
    } else if (task.scheduledStart && task.scheduledEnd) {
      body.start = { dateTime: task.scheduledStart.toISOString(), timeZone: 'UTC' }
      body.end = { dateTime: task.scheduledEnd.toISOString(), timeZone: 'UTC' }
    } else {
      return null // no valid schedule
    }
    return body
  }

  /**
   * Push a WorkingSession to the Google Calendar linked via Channel.timeboxToCalendarId.
   * No-op if task has no channel or channel has no target calendar.
   * Persists externalEventId / externalCalendarId on the session for later update/delete.
   */
  async pushSessionToCalendar(
    sessionId: string,
  ): Promise<{ ok: true; eventId: string } | { ok: false; reason: string }> {
    const session = await prisma.workingSession.findUnique({
      where: { id: sessionId },
      include: { task: true },
    })
    if (!session) return { ok: false, reason: 'session_not_found' }
    if (session.externalEventId) return { ok: true, eventId: session.externalEventId }
    if (!session.task?.channelId) return { ok: false, reason: 'no_channel' }

    const channel = await prisma.channel.findUnique({ where: { id: session.task.channelId } })
    if (!channel?.timeboxToCalendarId) return { ok: false, reason: 'no_target_calendar' }

    const calendar = await prisma.calendar.findUnique({
      where: { id: channel.timeboxToCalendarId },
      include: { account: true },
    })
    if (!calendar) return { ok: false, reason: 'calendar_not_found' }

    const accessToken = await this.ensureAccessToken(calendar.calendarAccountId)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const body = {
      summary: session.task.title,
      description: 'Auto-scheduled by ThePrimeWay',
      start: { dateTime: session.start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: session.end.toISOString(), timeZone: 'UTC' },
      extendedProperties: { private: { theprimewaySessionId: session.id } },
    }
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.providerCalendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { ok: false, reason: `google_${res.status}:${txt.slice(0, 120)}` }
    }
    const data = (await res.json()) as { id?: string }
    if (!data.id) return { ok: false, reason: 'no_event_id' }

    await prisma.workingSession.update({
      where: { id: session.id },
      data: { externalCalendarId: calendar.id, externalEventId: data.id },
    })
    return { ok: true, eventId: data.id }
  }

  /** Remove a previously-pushed session from Google Calendar. Safe to call when unpushed. */
  async removeSessionFromCalendar(sessionId: string): Promise<{ ok: boolean; reason?: string }> {
    const session = await prisma.workingSession.findUnique({ where: { id: sessionId } })
    if (!session) return { ok: true }
    if (!session.externalEventId || !session.externalCalendarId) return { ok: true }
    const calendar = await prisma.calendar.findUnique({
      where: { id: session.externalCalendarId },
    })
    if (!calendar) return { ok: false, reason: 'calendar_not_found' }
    const accessToken = await this.ensureAccessToken(calendar.calendarAccountId)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.providerCalendarId)}/events/${encodeURIComponent(session.externalEventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    )
    // 410 Gone is fine (already deleted on Google)
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      return { ok: false, reason: `google_${res.status}` }
    }
    await prisma.workingSession
      .update({ where: { id: session.id }, data: { externalEventId: null, externalCalendarId: null } })
      .catch(() => undefined)
    return { ok: true }
  }

  /** Patch an existing event with session's current start/end. If unpushed, push now. */
  async updateSessionOnCalendar(sessionId: string): Promise<{ ok: boolean; reason?: string }> {
    const session = await prisma.workingSession.findUnique({
      where: { id: sessionId },
      include: { task: true },
    })
    if (!session) return { ok: false, reason: 'session_not_found' }
    if (!session.externalEventId || !session.externalCalendarId) {
      const pushed = await this.pushSessionToCalendar(sessionId)
      return pushed.ok ? { ok: true } : { ok: false, reason: pushed.reason }
    }
    const calendar = await prisma.calendar.findUnique({ where: { id: session.externalCalendarId } })
    if (!calendar) return { ok: false, reason: 'calendar_not_found' }
    const accessToken = await this.ensureAccessToken(calendar.calendarAccountId)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const body = {
      start: { dateTime: session.start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: session.end.toISOString(), timeZone: 'UTC' },
      summary: session.task?.title ?? 'Working session',
    }
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.providerCalendarId)}/events/${encodeURIComponent(session.externalEventId)}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { ok: false, reason: `google_${res.status}:${txt.slice(0, 120)}` }
    }
    return { ok: true }
  }

  /** Create a Google Calendar event for a task, persist TaskCalendarBinding. */
  async createEventForTask(
    userId: string,
    task: {
      id: string
      title: string
      description?: string | null
      scheduledStart?: Date | null
      scheduledEnd?: Date | null
      scheduledDate?: Date | null
      isAllDay?: boolean | null
    },
  ): Promise<{ ok: true; eventId: string } | { ok: false; reason: string }> {
    const target = await calendarRepo.findTargetCalendarForUser(userId)
    if (!target) return { ok: false, reason: 'no_target_calendar' }

    const body = this.buildEventBody(task)
    if (!body) return { ok: false, reason: 'no_schedule' }

    const accessToken = await this.ensureAccessToken(target.account.id)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const providerCalId = (target.calendar as any).providerCalendarId
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(providerCalId)}/events`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!res.ok) {
        console.error('[CAL_SYNC] createEventForTask failed', await res.text())
        return { ok: false, reason: 'api_error' }
      }
      const event = (await res.json()) as { id: string }
      await calendarRepo.upsertTaskBinding({
        taskId: task.id,
        calendarId: target.calendar.id,
        calendarProvider: 'google',
        externalEventId: event.id,
        direction: 'app_to_google',
      })
      return { ok: true, eventId: event.id }
    } catch (err) {
      console.error('[CAL_SYNC] createEventForTask error', err)
      return { ok: false, reason: 'network_error' }
    }
  }

  /** Update the Google Calendar event linked to a task. */
  async updateEventForTask(
    userId: string,
    task: {
      id: string
      title: string
      description?: string | null
      scheduledStart?: Date | null
      scheduledEnd?: Date | null
      scheduledDate?: Date | null
      isAllDay?: boolean | null
    },
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    const binding = await calendarRepo.findBindingByTaskId(task.id)
    if (!binding || !binding.externalEventId) {
      // No existing binding: treat as create
      const res = await this.createEventForTask(userId, task)
      return res.ok ? { ok: true } : { ok: false, reason: res.reason }
    }

    const body = this.buildEventBody(task)
    if (!body) {
      // Task lost schedule: delete the event + binding
      return this.deleteEventForTask(userId, task.id)
    }

    const accessToken = await this.ensureAccessToken(binding.calendar.account.id)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const providerCalId = (binding.calendar as any).providerCalendarId
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(providerCalId)}/events/${encodeURIComponent(binding.externalEventId)}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!res.ok) {
        console.error('[CAL_SYNC] updateEventForTask failed', await res.text())
        return { ok: false, reason: 'api_error' }
      }
      await prisma.taskCalendarBinding.update({
        where: { id: binding.id },
        data: { lastSyncedAt: new Date(), lastSyncDirection: 'app_to_google' },
      })
      return { ok: true }
    } catch (err) {
      console.error('[CAL_SYNC] updateEventForTask error', err)
      return { ok: false, reason: 'network_error' }
    }
  }

  /** Delete the Google Calendar event + binding for a task. */
  async deleteEventForTask(
    _userId: string,
    taskId: string,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    const binding = await calendarRepo.findBindingByTaskId(taskId)
    if (!binding || !binding.externalEventId) return { ok: true }

    const accessToken = await this.ensureAccessToken(binding.calendar.account.id)
    if (!accessToken) {
      await calendarRepo.deleteBindingByTaskId(taskId)
      return { ok: false, reason: 'no_access_token' }
    }

    const providerCalId = (binding.calendar as any).providerCalendarId
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(providerCalId)}/events/${encodeURIComponent(binding.externalEventId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      // 404/410 are acceptable — event already gone
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        console.error('[CAL_SYNC] deleteEventForTask failed', await res.text())
        // still remove local binding so we don't keep retrying a broken link
      }
    } catch (err) {
      console.error('[CAL_SYNC] deleteEventForTask error', err)
    }

    await calendarRepo.deleteBindingByTaskId(taskId)
    return { ok: true }
  }

  // -------------------------------------------------------------------------

  private async refreshGoogleToken(
    refreshToken: string,
  ): Promise<{ access_token: string; expires_in: number } | null> {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.AUTH_GOOGLE_ID || '',
          client_secret: process.env.AUTH_GOOGLE_SECRET || '',
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

  // --- Watch channels (Google push notifications) --------------------------

  /** Subscribe to push notifications for a given calendar. */
  async subscribeWatchChannel(calendarId: string): Promise<{ ok: boolean; reason?: string }> {
    const calendar = await calendarRepo.findCalendarById(calendarId)
    if (!calendar) return { ok: false, reason: 'calendar_not_found' }
    const account = await calendarRepo.findAccountByCalendarAccountId(calendar.calendarAccountId)
    if (!account) return { ok: false, reason: 'account_not_found' }

    const accessToken = await this.ensureAccessToken(account.id)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const webhookBase = process.env.GOOGLE_CALENDAR_WEBHOOK_URL || process.env.API_BASE_URL
    if (!webhookBase) return { ok: false, reason: 'no_webhook_url' }

    const channelId = crypto.randomUUID()
    const token = crypto.randomUUID()
    const providerCalId = (calendar as any).providerCalendarId || (calendar as any).externalId

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(providerCalId)}/events/watch`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: `${webhookBase.replace(/\/$/, '')}/api/calendar/google/webhook`,
            token,
          }),
        },
      )
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        return { ok: false, reason: `watch_failed:${res.status}:${txt.slice(0, 120)}` }
      }
      const body = (await res.json()) as { resourceId: string; expiration: string }
      await (prisma as any).calendarWatchChannel.create({
        data: {
          calendarId: calendar.id,
          channelId,
          resourceId: body.resourceId,
          token,
          expiresAt: new Date(Number(body.expiration)),
        },
      })
      return { ok: true }
    } catch (err) {
      console.error('[CAL_WATCH] subscribe error', err)
      return { ok: false, reason: 'exception' }
    }
  }

  /** Handle an incoming webhook notification from Google. */
  async handleWatchNotification(headers: {
    channelId?: string
    resourceId?: string
    resourceState?: string
    token?: string
  }): Promise<{ ok: boolean; reason?: string }> {
    if (!headers.channelId) return { ok: false, reason: 'no_channel' }
    if (headers.resourceState === 'sync') return { ok: true } // initial handshake

    const channel = await (prisma as any).calendarWatchChannel.findUnique({
      where: { channelId: headers.channelId },
      include: { calendar: { include: { account: true } } },
    })
    if (!channel) return { ok: false, reason: 'channel_not_found' }
    if (channel.token && headers.token !== channel.token) return { ok: false, reason: 'bad_token' }

    const accessToken = await this.ensureAccessToken(channel.calendar.account.id)
    if (!accessToken) return { ok: false, reason: 'no_access_token' }

    const providerCalId =
      (channel.calendar as any).providerCalendarId || (channel.calendar as any).externalId
    const params = new URLSearchParams()
    if (channel.syncToken) params.set('syncToken', channel.syncToken)
    else params.set('timeMin', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    params.set('showDeleted', 'true')
    params.set('maxResults', '100')

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(providerCalId)}/events?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) return { ok: false, reason: `list_failed:${res.status}` }
      const body = (await res.json()) as {
        items?: Array<any>
        nextSyncToken?: string
      }

      for (const evt of body.items || []) {
        await this.upsertCalendarEventCache(channel.calendarId, evt).catch((e) =>
          console.error('[CAL_WATCH] upsert event cache error', e),
        )
        await this.applyGoogleEventToTask(evt).catch((e) =>
          console.error('[CAL_WATCH] apply event error', e),
        )
      }
      if (body.nextSyncToken) {
        await (prisma as any).calendarWatchChannel.update({
          where: { id: channel.id },
          data: { syncToken: body.nextSyncToken },
        })
      }
      return { ok: true }
    } catch (err) {
      console.error('[CAL_WATCH] notification error', err)
      return { ok: false, reason: 'exception' }
    }
  }

  /**
   * Mirror a Google Calendar event into the local `CalendarEvent` cache.
   * Consumed by the scheduling engine as busy-block hard constraints.
   */
  private async upsertCalendarEventCache(calendarId: string, evt: any) {
    if (!evt?.id) return
    if (evt.status === 'cancelled') {
      await prisma.calendarEvent.deleteMany({ where: { calendarId, externalId: evt.id } }).catch(() => undefined)
      return
    }
    const startStr = evt.start?.dateTime ?? evt.start?.date
    const endStr = evt.end?.dateTime ?? evt.end?.date
    if (!startStr || !endStr) return
    const start = new Date(startStr)
    const end = new Date(endStr)
    const isAllDay = !evt.start?.dateTime
    // Google `transparency: transparent` = marked as Available (free) → not busy
    const isBusy = (evt.transparency ?? 'opaque') === 'opaque'
    // declined: user's attendee status is 'declined'
    const selfAttendee = (evt.attendees ?? []).find((a: any) => a?.self === true)
    const isDeclined = selfAttendee?.responseStatus === 'declined'

    await prisma.calendarEvent.upsert({
      where: { calendarId_externalId: { calendarId, externalId: evt.id } },
      update: {
        title: evt.summary ?? '(untitled)',
        start,
        end,
        isBusy,
        isDeclined,
        isAllDay,
        syncedAt: new Date(),
      },
      create: {
        calendarId,
        externalId: evt.id,
        title: evt.summary ?? '(untitled)',
        start,
        end,
        isBusy,
        isDeclined,
        isAllDay,
      },
    })
  }

  private async applyGoogleEventToTask(evt: any) {
    if (!evt?.id) return
    const binding = await calendarRepo.findBindingByExternalEventId(evt.id)
    if (!binding) return // Unbound events ignored in v1

    if (evt.status === 'cancelled') {
      await prisma.task.update({
        where: { id: binding.taskId },
        data: { scheduledStart: null, scheduledEnd: null, scheduledDate: null },
      })
      await calendarRepo.deleteBindingByTaskId(binding.taskId)
      return
    }

    const start = evt.start?.dateTime ? new Date(evt.start.dateTime) : null
    const end = evt.end?.dateTime ? new Date(evt.end.dateTime) : null
    const title = evt.summary
    const updateData: Record<string, unknown> = {}
    if (title) updateData.title = title
    if (start) {
      updateData.scheduledStart = start
      updateData.scheduledDate = new Date(start.toISOString().slice(0, 10))
    }
    if (end) updateData.scheduledEnd = end
    if (Object.keys(updateData).length) {
      await prisma.task.update({ where: { id: binding.taskId }, data: updateData as any })
    }
  }

  /** Renew watch channels expiring within 24h. */
  async renewExpiringWatchChannels(): Promise<{ renewed: number; failed: number }> {
    const soon = new Date(Date.now() + 24 * 3600 * 1000)
    const channels = await (prisma as any).calendarWatchChannel.findMany({
      where: { expiresAt: { lte: soon } },
    })
    let renewed = 0
    let failed = 0
    for (const ch of channels) {
      const res = await this.subscribeWatchChannel(ch.calendarId)
      if (res.ok) {
        await (prisma as any).calendarWatchChannel.delete({ where: { id: ch.id } })
        renewed++
      } else {
        failed++
      }
    }
    return { renewed, failed }
  }

  /** List cached CalendarEvent rows for [from, to] that are not declined. */
  async listEventsInRange(userId: string, from: Date, to: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        calendar: { account: { userId } },
        start: { lt: to },
        end: { gt: from },
        isDeclined: false,
      },
      select: {
        id: true,
        calendarId: true,
        externalId: true,
        title: true,
        start: true,
        end: true,
        isBusy: true,
        isAllDay: true,
      },
      orderBy: { start: 'asc' },
    })
  }
}

export const calendarService = new CalendarService()
