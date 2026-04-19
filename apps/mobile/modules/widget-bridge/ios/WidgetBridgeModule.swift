import ExpoModulesCore
import WidgetKit

public class WidgetBridgeModule: Module {
  private let appGroup = "group.com.indrox.theprimeway"
  private let snapshotKey = "snapshot"
  private let pendingActionsKey = "pendingActions"

  public func definition() -> ModuleDefinition {
    Name("WidgetBridgeModule")

    Function("writeSnapshot") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroup) else { return }
      defaults.set(json, forKey: snapshotKey)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    Function("readPendingActions") { () -> String in
      guard let defaults = UserDefaults(suiteName: appGroup) else { return "[]" }
      return defaults.string(forKey: pendingActionsKey) ?? "[]"
    }

    Function("clearPendingActions") {
      guard let defaults = UserDefaults(suiteName: appGroup) else { return }
      defaults.removeObject(forKey: pendingActionsKey)
    }

    Function("reloadWidgets") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
