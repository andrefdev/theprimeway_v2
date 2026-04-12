import { PlayerHUD } from './PlayerHud'
import { DailyChallenges } from './DailyChallenges'
import { StreakCalendar } from './StreakCalendar'

export function GamificationWidget() {
  return (
    <div className="space-y-4">
      <PlayerHUD />
      <DailyChallenges />
      <StreakCalendar />
    </div>
  )
}
