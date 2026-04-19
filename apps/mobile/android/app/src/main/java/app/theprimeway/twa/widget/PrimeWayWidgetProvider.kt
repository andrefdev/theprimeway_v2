package app.theprimeway.twa.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import android.widget.TextView
import android.view.View
import org.json.JSONArray
import org.json.JSONObject

class PrimeWayWidgetProvider : AppWidgetProvider() {
    companion object {
        const val PREFS_NAME = "widget-data"
        const val KEY_SNAPSHOT = "snapshot"
        const val ACTION_COMPLETE_HABIT = "widget.COMPLETE_HABIT"
    }

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) {
            updateWidget(context, manager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_COMPLETE_HABIT) {
            val habitId = intent.getStringExtra("habitId") ?: return
            appendPendingAction(context, habitId)
            // Wake the app via deep link so it drains the pending action queue
            val launch = Intent(Intent.ACTION_VIEW, Uri.parse("theprimeway://sync")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try { context.startActivity(launch) } catch (_: Throwable) {}
        }
    }

    private fun appendPendingAction(context: Context, habitId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString("pendingActions", "[]") ?: "[]"
        val arr = try { JSONArray(raw) } catch (_: Throwable) { JSONArray() }
        val obj = JSONObject()
        obj.put("id", java.util.UUID.randomUUID().toString())
        obj.put("kind", "completeHabit")
        obj.put("targetId", habitId)
        obj.put("timestamp", java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(java.util.Date()))
        arr.put(obj)
        prefs.edit().putString("pendingActions", arr.toString()).apply()
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
        val pkg = context.packageName
        val views = RemoteViews(pkg, context.resources.getIdentifier("primeway_widget", "layout", pkg))

        val snapshot = loadSnapshot(context)
        val streak = snapshot?.optInt("currentStreak") ?: 0
        val completed = snapshot?.optInt("taskCompletedCount") ?: 0
        val total = snapshot?.optInt("taskTotal") ?: 0

        views.setTextViewText(context.resources.getIdentifier("widget_streak", "id", pkg), "🔥 $streak")
        views.setTextViewText(context.resources.getIdentifier("widget_tasks_summary", "id", pkg), "$completed/$total tasks")

        val nextHabit = snapshot?.optJSONObject("nextHabit")
        if (nextHabit != null) {
            val habitId = nextHabit.optString("id")
            val habitName = nextHabit.optString("name")
            views.setTextViewText(context.resources.getIdentifier("widget_next_habit", "id", pkg), "Next: $habitName (tap to check ✓)")
            val intent = Intent(context, PrimeWayWidgetProvider::class.java).apply {
                action = ACTION_COMPLETE_HABIT
                putExtra("habitId", habitId)
            }
            val pi = PendingIntent.getBroadcast(context, habitId.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(context.resources.getIdentifier("widget_next_habit", "id", pkg), pi)
        } else {
            views.setTextViewText(context.resources.getIdentifier("widget_next_habit", "id", pkg), "")
        }

        // Tap widget body → open app
        val launch = Intent(Intent.ACTION_VIEW, Uri.parse("theprimeway://"))
        val launchPi = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(context.resources.getIdentifier("widget_tasks_summary", "id", pkg), launchPi)

        manager.updateAppWidget(id, views)
    }

    private fun loadSnapshot(context: Context): JSONObject? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_SNAPSHOT, null) ?: return null
        return try { JSONObject(raw) } catch (_: Throwable) { null }
    }
}
