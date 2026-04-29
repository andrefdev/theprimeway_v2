import { formatInTimeZone } from 'date-fns-tz'
import { prisma } from './prisma'

export type AIContext = {
  userId: string
  now: Date
  today: string
  currentTime: string
  dayOfWeek: string
  timezone: string
  locale: 'en' | 'es'
  language: 'English' | 'Spanish'
}

const LANG: Record<'en' | 'es', AIContext['language']> = {
  en: 'English',
  es: 'Spanish',
}

export async function getAIContext(userId: string): Promise<AIContext> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timezone: true, locale: true },
  })
  const timezone = settings?.timezone || 'UTC'
  const locale: 'en' | 'es' = settings?.locale === 'es' ? 'es' : 'en'
  const now = new Date()
  return {
    userId,
    now,
    today: formatInTimeZone(now, timezone, 'yyyy-MM-dd'),
    currentTime: formatInTimeZone(now, timezone, 'HH:mm'),
    dayOfWeek: formatInTimeZone(now, timezone, 'EEEE'),
    timezone,
    locale,
    language: LANG[locale],
  }
}
