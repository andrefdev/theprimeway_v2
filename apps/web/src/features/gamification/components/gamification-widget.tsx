import { PlayerHUD } from './player-hud'
import { DailyChallenges } from './daily-challenges'
import { StreakCalendar } from './streak-calendar'

export function GamificationWidget() {
  return (
    <div className="space-y-4">
      <PlayerHUD />
      <DailyChallenges />
      <StreakCalendar />
    </div>
  )
}
