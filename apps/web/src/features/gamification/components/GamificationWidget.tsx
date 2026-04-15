import { PlayerHUD } from './PlayerHud'
import { RankProgression } from './RankProgression'
import { DailyChallenges } from './DailyChallenges'
import { StreakCalendar } from './StreakCalendar'
import { AchievementTree } from './AchievementTree'

export function GamificationWidget() {
  return (
    <div className="space-y-4">
      <PlayerHUD />
      <RankProgression />
      <DailyChallenges />
      <AchievementTree />
      <StreakCalendar />
    </div>
  )
}
