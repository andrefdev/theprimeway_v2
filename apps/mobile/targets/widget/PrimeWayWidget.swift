import WidgetKit
import SwiftUI

// MARK: - Small widget: streak + task progress

struct SmallWidgetView: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 4) {
        Image(systemName: "flame.fill")
          .foregroundStyle(.orange)
        Text("\(snapshot.currentStreak)")
          .font(.system(size: 28, weight: .bold))
        Text("day streak")
          .font(.caption2)
          .foregroundStyle(.secondary)
      }
      Spacer()
      VStack(alignment: .leading, spacing: 2) {
        Text("Today")
          .font(.caption2)
          .foregroundStyle(.secondary)
        Text("\(snapshot.taskCompletedCount)/\(snapshot.taskTotal) tasks")
          .font(.system(size: 14, weight: .semibold))
        if let habit = snapshot.nextHabit {
          Text("Next: \(habit.name)")
            .font(.caption2)
            .lineLimit(1)
            .foregroundStyle(.secondary)
        }
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(Color("widgetBackground"), for: .widget)
  }
}

// MARK: - Medium widget: tasks list

struct MediumWidgetView: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("Today")
          .font(.system(size: 14, weight: .bold))
        Spacer()
        HStack(spacing: 3) {
          Image(systemName: "flame.fill").foregroundStyle(.orange).font(.caption)
          Text("\(snapshot.currentStreak)").font(.caption).fontWeight(.semibold)
        }
      }
      if snapshot.tasks.isEmpty {
        Spacer()
        Text("No tasks today")
          .font(.caption)
          .foregroundStyle(.secondary)
        Spacer()
      } else {
        ForEach(snapshot.tasks.prefix(4)) { task in
          HStack(spacing: 8) {
            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
              .foregroundStyle(task.completed ? .green : .secondary)
              .font(.system(size: 12))
            Text(task.title)
              .font(.system(size: 12))
              .lineLimit(1)
              .strikethrough(task.completed)
              .foregroundStyle(task.completed ? .secondary : .primary)
            Spacer()
            if let slot = task.timeSlot {
              Text(slot)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
            }
          }
        }
        Spacer(minLength: 0)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(Color("widgetBackground"), for: .widget)
  }
}

// MARK: - Large widget: tasks + pending habits with check-in buttons

struct LargeWidgetView: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("The Prime Way")
          .font(.system(size: 14, weight: .bold))
        Spacer()
        HStack(spacing: 3) {
          Image(systemName: "flame.fill").foregroundStyle(.orange).font(.caption)
          Text("\(snapshot.currentStreak)").font(.caption).fontWeight(.semibold)
        }
      }

      Text("Tasks (\(snapshot.taskCompletedCount)/\(snapshot.taskTotal))")
        .font(.caption2).foregroundStyle(.secondary)
      VStack(alignment: .leading, spacing: 3) {
        ForEach(snapshot.tasks.prefix(3)) { task in
          HStack(spacing: 6) {
            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
              .foregroundStyle(task.completed ? .green : .secondary)
              .font(.system(size: 11))
            Text(task.title).font(.system(size: 12)).lineLimit(1)
              .strikethrough(task.completed)
              .foregroundStyle(task.completed ? .secondary : .primary)
            Spacer()
          }
        }
      }

      Divider()

      Text("Habits")
        .font(.caption2).foregroundStyle(.secondary)
      VStack(alignment: .leading, spacing: 4) {
        ForEach(snapshot.pendingHabits.prefix(3)) { habit in
          HStack(spacing: 6) {
            if #available(iOS 17.0, *) {
              Button(intent: HabitToggleIntent(habitId: habit.id)) {
                Image(systemName: "circle")
                  .foregroundStyle(.secondary)
                  .font(.system(size: 13))
              }
              .buttonStyle(.plain)
            } else {
              Image(systemName: "circle")
                .foregroundStyle(.secondary)
                .font(.system(size: 13))
            }
            Text(habit.name).font(.system(size: 12)).lineLimit(1)
            Spacer()
            if habit.streak > 0 {
              Text("\(habit.streak)d").font(.system(size: 10)).foregroundStyle(.orange)
            }
          }
        }
      }
      Spacer(minLength: 0)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(Color("widgetBackground"), for: .widget)
  }
}

// MARK: - Entry view selector

struct PrimeWayWidgetEntryView: View {
  var entry: SnapshotEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    switch family {
    case .systemSmall:
      SmallWidgetView(snapshot: entry.snapshot)
    case .systemMedium:
      MediumWidgetView(snapshot: entry.snapshot)
    case .systemLarge:
      LargeWidgetView(snapshot: entry.snapshot)
    default:
      SmallWidgetView(snapshot: entry.snapshot)
    }
  }
}

// MARK: - Widget + bundle

struct PrimeWayWidget: Widget {
  let kind: String = "PrimeWayWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      PrimeWayWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("The Prime Way")
    .description("Today's tasks, streak, and quick habit check-ins.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

@main
struct PrimeWayWidgetBundle: WidgetBundle {
  var body: some Widget {
    PrimeWayWidget()
  }
}
