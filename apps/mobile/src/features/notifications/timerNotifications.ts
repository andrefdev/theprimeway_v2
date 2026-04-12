import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const TIMER_CHANNEL_ID = 'timer-persistent';
const POMODORO_NOTIF_ID = 'pomodoro-timer';
const TASK_TIMER_NOTIF_ID = 'task-timer';
const POMODORO_COMPLETION_ID = 'pomodoro-done';

/**
 * Creates the Android notification channel for persistent timer notifications.
 * Uses IMPORTANCE_MAX + ongoing so it behaves like a native timer:
 * stays on lock-screen and can't be swiped away.
 */
export async function setupTimerChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: 'Timer',
      description: 'Persistent timer notifications for Pomodoro and task timers',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 0],
      sound: undefined,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: false,
      showBadge: false,
    });
  }
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────
// POMODORO PERSISTENT NOTIFICATION
// ────────────────────────────────────────────────

/**
 * Shows/updates the ongoing Pomodoro notification with the remaining time.
 * On Android this creates a sticky notification that survives lock-screen.
 * On iOS it schedules an immediate local notification (iOS doesn't support
 * true ongoing notifications, but it will show on lock screen).
 */
export async function showPomodoroNotification(
  remainingSeconds: number,
  sessionLabel: string
) {
  await Notifications.scheduleNotificationAsync({
    identifier: POMODORO_NOTIF_ID,
    content: {
      title: `⏱ ${sessionLabel}`,
      body: `${formatMMSS(remainingSeconds)} remaining`,
      sound: false,
      sticky: true, // Android: can't be swiped away
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        channelId: TIMER_CHANNEL_ID,
      }),
    },
    trigger: null, // Show immediately
  });
}

/**
 * Schedules a notification for when the Pomodoro session completes.
 * This fires even if the app is backgrounded/killed, ensuring the user
 * always gets notified when the timer is done.
 */
export async function schedulePomodoroCompletion(
  remainingSeconds: number,
  sessionLabel: string
) {
  // Cancel any previously scheduled completion
  await Notifications.cancelScheduledNotificationAsync(POMODORO_COMPLETION_ID).catch(() => {});

  if (remainingSeconds <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: POMODORO_COMPLETION_ID,
    content: {
      title: '🎉 Session complete!',
      body: `Your ${sessionLabel} session has ended. Time for the next step!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' && {
        channelId: TIMER_CHANNEL_ID,
      }),
    },
    trigger: { seconds: remainingSeconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

/**
 * Dismisses the ongoing Pomodoro notification and cancels the scheduled completion.
 */
export async function dismissPomodoroNotification() {
  await Notifications.dismissNotificationAsync(POMODORO_NOTIF_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(POMODORO_COMPLETION_ID).catch(() => {});
}

// ────────────────────────────────────────────────
// TASK TIMER PERSISTENT NOTIFICATION
// ────────────────────────────────────────────────

/**
 * Shows/updates the ongoing task timer notification.
 */
export async function showTaskTimerNotification(
  elapsedSeconds: number,
  taskTitle: string,
  plannedMinutes?: number
) {
  const elapsed = formatMMSS(elapsedSeconds);
  const planned = plannedMinutes ? formatMMSS(plannedMinutes * 60) : null;
  const body = planned
    ? `${elapsed} / ${planned}`
    : `${elapsed} elapsed`;

  await Notifications.scheduleNotificationAsync({
    identifier: TASK_TIMER_NOTIF_ID,
    content: {
      title: `⏱ ${taskTitle}`,
      body,
      sound: false,
      sticky: true,
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        channelId: TIMER_CHANNEL_ID,
      }),
    },
    trigger: null,
  });
}

/**
 * Dismisses the ongoing task timer notification.
 */
export async function dismissTaskTimerNotification() {
  await Notifications.dismissNotificationAsync(TASK_TIMER_NOTIF_ID).catch(() => {});
}
