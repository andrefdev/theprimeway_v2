import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { QueryError } from '@/shared/components/QueryError'
import { CheckIcon } from '@/shared/components/Icons'
import { MODE_LABEL_KEYS, type TimerMode } from './PomodoroModeSelector'
import type { PomodoroSession } from '@repo/shared/types'
import { UseQueryResult } from '@tanstack/react-query'

interface PomodoroSessionListProps {
  recentSessions: PomodoroSession[]
  sessionsQuery: UseQueryResult<any>
}

export function PomodoroSessionList({ recentSessions, sessionsQuery }: PomodoroSessionListProps) {
  const { t } = useTranslation('pomodoro')

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{t('recentSessions')}</h3>

      {sessionsQuery.isLoading && <SkeletonList lines={3} />}
      {sessionsQuery.isError && (
        <QueryError message={t('failedToLoad')} onRetry={() => sessionsQuery.refetch()} />
      )}

      {!sessionsQuery.isLoading && recentSessions.length > 0 && (
        <div className="space-y-2">
          {recentSessions.map((session: PomodoroSession) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      session.sessionType === 'focus'
                        ? 'bg-primary/10 text-primary'
                        : session.sessionType === 'short_break'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {session.durationMinutes}m
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t(MODE_LABEL_KEYS[session.sessionType as TimerMode] ?? session.sessionType)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {session.endedAt && ` - ${new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                <div>
                  {session.isCompleted ? (
                    <CheckIcon size={16} strokeWidth={2} className="text-success" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('incomplete')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!sessionsQuery.isLoading && recentSessions.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('noSessions')}</p>
      )}
    </div>
  )
}
