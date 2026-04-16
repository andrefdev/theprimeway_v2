import { PlayerHUD } from './PlayerHud'
import { RankProgression } from './RankProgression'
import { DailyChallenges } from './DailyChallenges'
import { StreakCalendar } from './StreakCalendar'
import { AchievementTree } from './AchievementTree'
import { FatigueAlert } from './FatigueAlert'

export function GamificationWidget() {
  return (
    <div className="space-y-4">
      <FatigueAlert />
      <PlayerHUD />
      <RankProgression />
      <DailyChallenges />
      <AchievementTree />
      <StreakCalendar />
    </div>
  )
}
