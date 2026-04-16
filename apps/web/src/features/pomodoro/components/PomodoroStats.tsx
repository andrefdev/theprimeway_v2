import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/components/ui/card'
import type { PomodoroStats } from '@repo/shared/types'

interface PomodoroStatsProps {
  stats?: PomodoroStats
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  )
}

export function PomodoroStats({ stats }: PomodoroStatsProps) {
  const { t } = useTranslation('pomodoro')

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatBox
        label={t('statToday')}
        value={`${stats?.todaySessions ?? 0}`}
        sub={t('statSessions')}
      />
      <StatBox
        label={t('statFocusToday')}
        value={`${stats?.todayFocusMinutes ?? 0}`}
        sub={t('statMinutes')}
      />
      <StatBox
        label={t('statTotal')}
        value={`${stats?.completedSessions ?? 0}`}
        sub={t('statTotalSessions')}
      />
      <StatBox
        label={t('statStreak')}
        value={`${stats?.streakDays ?? 0}`}
        sub={t('statDays')}
      />
    </div>
  )
}
