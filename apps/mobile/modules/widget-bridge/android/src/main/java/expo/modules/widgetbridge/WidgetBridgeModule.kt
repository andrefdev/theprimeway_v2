package expo.modules.widgetbridge

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetBridgeModule : Module() {
  companion object {
    const val PREFS_NAME = "widget-data"
    const val KEY_SNAPSHOT = "snapshot"
    const val KEY_PENDING_ACTIONS = "pendingActions"
    // Must match Android widget plugin
    const val WIDGET_PROVIDER_CLASS_SUFFIX = ".widget.PrimeWayWidgetProvider"
  }

  override fun definition() = ModuleDefinition {
    Name("WidgetBridgeModule")

    Function("writeSnapshot") { json: String ->
      val ctx = appContext.reactContext ?: return@Function Unit
      ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(KEY_SNAPSHOT, json)
        .apply()
      reloadAllWidgets(ctx)
    }

    Function("readPendingActions") {
      val ctx = appContext.reactContext ?: return@Function "[]"
      ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(KEY_PENDING_ACTIONS, "[]") ?: "[]"
    }

    Function("clearPendingActions") {
      val ctx = appContext.reactContext ?: return@Function Unit
      ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .remove(KEY_PENDING_ACTIONS)
        .apply()
    }

    Function("reloadWidgets") {
      val ctx = appContext.reactContext ?: return@Function Unit
      reloadAllWidgets(ctx)
    }
  }

  private fun reloadAllWidgets(ctx: Context) {
    try {
      val providerName = ctx.packageName + WIDGET_PROVIDER_CLASS_SUFFIX
      val component = ComponentName(ctx, providerName)
      val manager = AppWidgetManager.getInstance(ctx)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isNotEmpty()) {
        val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
          setComponent(component)
          putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }
        ctx.sendBroadcast(intent)
      }
    } catch (_: Throwable) {
      // Provider may not be registered yet (e.g. in tests) — ignore
    }
  }
}
