/* eslint-disable @typescript-eslint/no-var-requires */
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_PROVIDER_CLASS = 'PrimeWayWidgetProvider';
const WIDGET_PACKAGE_SUFFIX = '.widget';

const WIDGET_INFO_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/primeway_widget"
    android:previewImage="@mipmap/ic_launcher"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`;

const WIDGET_LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/primeway_widget_bg">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">
        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_weight="1"
            android:layout_height="wrap_content"
            android:text="The Prime Way"
            android:textStyle="bold"
            android:textSize="14sp"
            android:textColor="#111111" />
        <TextView
            android:id="@+id/widget_streak"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="🔥 0"
            android:textSize="12sp"
            android:textColor="#E25B24" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_tasks_summary"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="0/0 tasks"
        android:textSize="12sp"
        android:textColor="#666666" />

    <LinearLayout
        android:id="@+id/widget_task_list"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:layout_marginTop="4dp" />

    <TextView
        android:id="@+id/widget_next_habit"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text=""
        android:textSize="12sp"
        android:textColor="#280FFB" />
</LinearLayout>
`;

const WIDGET_BG_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="16dp" />
</shape>
`;

function getProviderKotlin(packageName) {
  const widgetPkg = `${packageName}${WIDGET_PACKAGE_SUFFIX}`;
  return `package ${widgetPkg}

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

class ${WIDGET_PROVIDER_CLASS} : AppWidgetProvider() {
    companion object {
        const val PREFS_NAME = "widget-data"
        const val KEY_SNAPSHOT = "snapshot"
        const val ACTION_COMPLETE_HABIT = "${WIDGET_PACKAGE_SUFFIX.substring(1)}.COMPLETE_HABIT"
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
            val intent = Intent(context, ${WIDGET_PROVIDER_CLASS}::class.java).apply {
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
`;
}

const withAndroidWidgetManifest = (config) => {
  return withAndroidManifest(config, async (cfg) => {
    const pkg = AndroidConfig.Package.getPackage(cfg) || cfg.android?.package;
    if (!pkg) return cfg;
    const widgetPkg = `${pkg}${WIDGET_PACKAGE_SUFFIX}`;
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    app.receiver = app.receiver || [];
    const existing = app.receiver.find((r) => r.$?.['android:name'] === `${widgetPkg}.${WIDGET_PROVIDER_CLASS}`);
    if (!existing) {
      app.receiver.push({
        $: {
          'android:name': `${widgetPkg}.${WIDGET_PROVIDER_CLASS}`,
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': `${WIDGET_PACKAGE_SUFFIX.substring(1)}.COMPLETE_HABIT` } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/primeway_widget_info',
            },
          },
        ],
      });
    }
    return cfg;
  });
};

const withAndroidWidgetFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) return cfg;
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const widgetPkg = `${pkg}${WIDGET_PACKAGE_SUFFIX}`;

      // Resources
      const resDir = path.join(projectRoot, 'app', 'src', 'main', 'res');
      const xmlDir = path.join(resDir, 'xml');
      const layoutDir = path.join(resDir, 'layout');
      const drawableDir = path.join(resDir, 'drawable');
      for (const d of [xmlDir, layoutDir, drawableDir]) {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      }
      fs.writeFileSync(path.join(xmlDir, 'primeway_widget_info.xml'), WIDGET_INFO_XML);
      fs.writeFileSync(path.join(layoutDir, 'primeway_widget.xml'), WIDGET_LAYOUT_XML);
      fs.writeFileSync(path.join(drawableDir, 'primeway_widget_bg.xml'), WIDGET_BG_XML);

      // Kotlin source
      const javaRoot = path.join(projectRoot, 'app', 'src', 'main', 'java');
      const widgetDir = path.join(javaRoot, ...widgetPkg.split('.'));
      if (!fs.existsSync(widgetDir)) fs.mkdirSync(widgetDir, { recursive: true });
      fs.writeFileSync(
        path.join(widgetDir, `${WIDGET_PROVIDER_CLASS}.kt`),
        getProviderKotlin(pkg)
      );

      return cfg;
    },
  ]);
};

module.exports = (config) => {
  config = withAndroidWidgetManifest(config);
  config = withAndroidWidgetFiles(config);
  return config;
};
