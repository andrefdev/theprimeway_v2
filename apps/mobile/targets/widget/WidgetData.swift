import Foundation
import WidgetKit

// MARK: - Shared data shape (must match widgetData.ts)

struct WidgetTask: Codable, Identifiable {
  let id: String
  let title: String
  let priority: String
  let completed: Bool
  let timeSlot: String?
}

struct WidgetHabit: Codable, Identifiable {
  let id: String
  let name: String
  let completed: Bool
  let streak: Int
}

struct WidgetSnapshot: Codable {
  let updatedAt: String
  let tasks: [WidgetTask]
  let taskCompletedCount: Int
  let taskTotal: Int
  let currentStreak: Int
  let longestStreak: Int
  let nextHabit: WidgetHabit?
  let pendingHabits: [WidgetHabit]

  static let placeholder = WidgetSnapshot(
    updatedAt: ISO8601DateFormatter().string(from: Date()),
    tasks: [
      WidgetTask(id: "1", title: "Review quarterly goals", priority: "high", completed: false, timeSlot: "09:00"),
      WidgetTask(id: "2", title: "Deep work: auth refactor", priority: "medium", completed: false, timeSlot: "11:00"),
      WidgetTask(id: "3", title: "Team standup", priority: "low", completed: true, timeSlot: "10:00"),
    ],
    taskCompletedCount: 1,
    taskTotal: 3,
    currentStreak: 12,
    longestStreak: 28,
    nextHabit: WidgetHabit(id: "h1", name: "Meditate 10 min", completed: false, streak: 12),
    pendingHabits: [
      WidgetHabit(id: "h1", name: "Meditate 10 min", completed: false, streak: 12),
      WidgetHabit(id: "h2", name: "Read 20 pages", completed: false, streak: 5),
    ]
  )
}

// MARK: - Storage (MMKV writes as JSON string into App Group UserDefaults via the MMKV bridge;
// we read it from the App Group UserDefaults directly)

enum WidgetStorage {
  static let appGroup = "group.com.indrox.theprimeway"
  private static let snapshotKey = "snapshot"
  private static let pendingActionsKey = "pendingActions"

  static func defaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroup)
  }

  static func loadSnapshot() -> WidgetSnapshot {
    guard let defaults = defaults(),
          let raw = defaults.string(forKey: snapshotKey),
          let data = raw.data(using: .utf8) else {
      return .placeholder
    }
    do {
      return try JSONDecoder().decode(WidgetSnapshot.self, from: data)
    } catch {
      return .placeholder
    }
  }

  struct PendingAction: Codable {
    let id: String
    let kind: String
    let targetId: String
    let timestamp: String
  }

  static func appendPendingAction(_ action: PendingAction) {
    guard let defaults = defaults() else { return }
    var current: [PendingAction] = []
    if let raw = defaults.string(forKey: pendingActionsKey),
       let data = raw.data(using: .utf8),
       let decoded = try? JSONDecoder().decode([PendingAction].self, from: data) {
      current = decoded
    }
    current.append(action)
    if let data = try? JSONEncoder().encode(current),
       let str = String(data: data, encoding: .utf8) {
      defaults.set(str, forKey: pendingActionsKey)
    }
  }
}
