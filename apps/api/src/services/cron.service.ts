import { cronRepo } from '../repositories/cron.repo'

// ---------------------------------------------------------------------------
// Motivational messages
// ---------------------------------------------------------------------------
const MOTIVATION_MESSAGES = {
  en: [
    "Believe you can and you're halfway there.",
    'The only way to do great work is to love what you do.',
    "Your time is limited, don't waste it living someone else's life.",
    'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    'Hardships often prepare ordinary people for an extraordinary destiny.',
    'Dream big and dare to fail.',
    'It does not matter how slowly you go as long as you do not stop.',
    "Everything you've ever wanted is on the other side of fear.",
    'Success is getting what you want, happiness is wanting what you get.',
    "Don't count the days, make the days count.",
  ],
  es: [
    'Cree que puedes y ya estaras a medio camino.',
    'La unica forma de hacer un gran trabajo es amar lo que haces.',
    'Tu tiempo es limitado, no lo desperdicies viviendo la vida de alguien mas.',
    'El exito no es definitivo, el fracaso no es fatal: lo que cuenta es el valor para continuar.',
    'Las dificultades a menudo preparan a la gente comun para un destino extraordinario.',
    'Suena en grande y atrevete a fallar.',
    'No importa lo lento que vayas siempre y cuando no te detengas.',
    'Todo lo que siempre has querido esta al otro lado del miedo.',
    'El exito es conseguir lo que quieres, la felicidad es querer lo que consigues.',
    'No cuentes los dias, haz que los dias cuenten.',
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTimeUntil(minutes: number, lang: string): string {
  if (minutes <= 1) return lang === 'es' ? 'en 1 minuto' : 'in 1 minute'
  if (minutes < 60) return lang === 'es' ? `en ${minutes} minutos` : `in ${minutes} minutes`
  const hours = Math.round(minutes / 60)
  if (hours === 1) return lang === 'es' ? 'en 1 hora' : 'in 1 hour'
  if (hours < 24) return lang === 'es' ? `en ${hours} horas` : `in ${hours} hours`
  return lang === 'es' ? 'en 1 dia' : 'in 1 day'
}

function isWithinReminderWindow(now: Date, reminderTime: string, timezone: string): boolean {
  const userNow = getDateInTimezone(now, timezone)
  const [targetHour = 0, targetMinute = 0] = reminderTime.split(':').map(Number)
  const userHour = userNow.getHours()
  const userMinute = userNow.getMinutes()

  const targetTotalMinutes = targetHour * 60 + targetMinute
  const currentTotalMinutes = userHour * 60 + userMinute

  const diff = currentTotalMinutes - targetTotalMinutes
  return diff >= 0 && diff < 5
}

function getDateInTimezone(date: Date, timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || '0', 10)

    return new Date(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    )
  } catch {
    return date
  }
}

class CronService {
  async sendDailyMotivation() {
    const users = await cronRepo.findUsersWithDailyMotivation()

    if (users.length === 0) {
      return { message: 'No users to send to' }
    }

    const usersByLang: Record<string, string[]> = { en: [], es: [] }
    for (const user of users) {
      const locale = user.settings?.locale || 'en'
      const lang = locale.startsWith('es') ? 'es' : 'en'
      usersByLang[lang]!.push(user.id)
    }

    const results: Array<{ lang: string; userCount: number; message: string }> = []

    for (const [lang, userIds] of Object.entries(usersByLang)) {
      if (userIds.length === 0) continue

      const messages = MOTIVATION_MESSAGES[lang as keyof typeof MOTIVATION_MESSAGES]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]!

      await cronRepo.findActiveDevicesByUserIds(userIds)
      // NOTE: Actual FCM sending requires firebase-admin SDK

      results.push({ lang, userCount: userIds.length, message: randomMessage })
    }

    return {
      success: true,
      results,
      _note: 'FCM push delivery requires firebase-admin integration',
    }
  }

  async processReminders(now: Date) {
    const [taskResults, habitResults] = await Promise.all([
      this.processTaskReminders(now),
      this.processHabitReminders(now),
    ])

    return { success: true, timestamp: now.toISOString(), tasks: taskResults, habits: habitResults }
  }

  async processHabitRemindersOnly(now: Date) {
    return this.processHabitReminders(now)
  }

  private async processTaskReminders(now: Date) {
    const users = await cronRepo.findUsersWithTaskReminders()

    if (users.length === 0) {
      return { message: 'No users with task reminders enabled', sent: 0 }
    }

    const nowMs = now.getTime()
    let totalSent = 0
    const errors: string[] = []

    for (const user of users) {
      const offsetMinutes = user.notificationPreferences?.taskReminderOffset ?? 30
      const reminderWindowMs = offsetMinutes * 60 * 1000

      const tasks = await cronRepo.findTasksForReminder(
        user.id,
        new Date(nowMs),
        new Date(nowMs + reminderWindowMs),
      )

      if (tasks.length === 0) continue

      const devices = await cronRepo.findActiveDevicesByUserId(user.id)
      if (devices.length === 0) continue

      const locale = user.settings?.locale || 'en'
      const lang = locale.startsWith('es') ? 'es' : 'en'

      for (const task of tasks) {
        const targetDate = task.scheduledStart || task.dueDate!
        const minutesUntil = Math.round((targetDate.getTime() - nowMs) / 60000)
        void formatTimeUntil(minutesUntil, lang)

        try {
          // NOTE: Wire up sendNotification(tokens, { title, body }, { url, tag })
          await cronRepo.markTaskReminded(task.id)
          totalSent++
        } catch (error) {
          errors.push(`Task ${task.id}: ${String(error)}`)
        }
      }
    }

    return { sent: totalSent, errors: errors.length > 0 ? errors : undefined }
  }

  private async processHabitReminders(now: Date) {
    const users = await cronRepo.findUsersWithHabitReminders()

    if (users.length === 0) {
      return { message: 'No users with habit reminders', sent: 0 }
    }

    const usersToRemind: Record<string, string[]> = { en: [], es: [] }

    for (const user of users) {
      const reminderTime = user.notificationPreferences?.habitReminderTime ?? '20:00'
      const userTz = user.settings?.timezone || 'UTC'

      if (!isWithinReminderWindow(now, reminderTime, userTz)) continue

      const userNow = getDateInTimezone(now, userTz)
      const todayStart = new Date(userNow)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(userNow)
      todayEnd.setHours(23, 59, 59, 999)
      const currentDayIndex = userNow.getDay()

      const habitLogs = await cronRepo.findHabitLogsByUserAndDate(user.id, todayStart, todayEnd)

      let hasIncomplete = false
      for (const habit of user.habits) {
        if (habit.weekDays && Array.isArray(habit.weekDays)) {
          const days = habit.weekDays as number[]
          if (!days.includes(currentDayIndex)) continue
        }

        const log = habitLogs.find((l) => l.habitId === habit.id)
        const completed = log?.completedCount || 0
        const target = habit.targetFrequency || 1

        if (completed < target) {
          hasIncomplete = true
          break
        }
      }

      if (hasIncomplete) {
        const locale = user.settings?.locale || 'en'
        const lang = locale.startsWith('es') ? 'es' : 'en'
        usersToRemind[lang]!.push(user.id)
      }
    }

    let totalSent = 0
    for (const [_lang, userIds] of Object.entries(usersToRemind)) {
      if (userIds.length === 0) continue

      const devices = await cronRepo.findActiveDevicesByUserIds(userIds)
      if (devices.length === 0) continue

      // NOTE: Wire up sendNotification(tokens, { title, body }, { url, tag })
      totalSent += userIds.length
    }

    return { sent: totalSent }
  }
}

export const cronService = new CronService()
