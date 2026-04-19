import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct HabitToggleIntent: AppIntent {
  static var title: LocalizedStringResource = "Complete habit"
  static var description = IntentDescription("Mark a habit as completed for today.")

  @Parameter(title: "Habit ID")
  var habitId: String

  init() {}
  init(habitId: String) {
    self.habitId = habitId
  }

  func perform() async throws -> some IntentResult {
    let action = WidgetStorage.PendingAction(
      id: UUID().uuidString,
      kind: "completeHabit",
      targetId: habitId,
      timestamp: ISO8601DateFormatter().string(from: Date())
    )
    WidgetStorage.appendPendingAction(action)
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}
