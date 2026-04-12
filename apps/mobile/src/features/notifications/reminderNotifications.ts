import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_CHANNEL_ID = 'reminders';
const HABIT_REMINDER_PREFIX = 'habit-reminder-';
const TASK_REMINDER_PREFIX = 'task-reminder-';
const HABIT_REMINDERS_KEY = 'habit_reminder_settings';

interface HabitReminderSettings {
  [habitId: string]: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
}

/**
 * Creates the Android notification channel for habit/task reminders.
 */
export async function setupReminderChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Reminders',
      description: 'Reminders for habits and tasks',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

// ────────────────────────────────────────────────
// HABIT REMINDERS
// ────────────────────────────────────────────────

/**
 * Schedules a daily reminder for a habit at a specific time.
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  hour: number,
  minute: number
) {
  const identifier = `${HABIT_REMINDER_PREFIX}${habitId}`;

  // Cancel existing reminder for this habit
  await cancelHabitReminder(habitId);

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `🔄 ${habitName}`,
      body: `Time to work on your habit: ${habitName}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        channelId: REMINDER_CHANNEL_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  // Save settings
  await saveHabitReminderSetting(habitId, { enabled: true, hour, minute });
}

/**
 * Cancels the daily reminder for a specific habit.
 */
export async function cancelHabitReminder(habitId: string) {
  const identifier = `${HABIT_REMINDER_PREFIX}${habitId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await saveHabitReminderSetting(habitId, { enabled: false, hour: 9, minute: 0 });
}

/**
 * Gets saved reminder settings for all habits.
 */
export async function getHabitReminderSettings(): Promise<HabitReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(HABIT_REMINDERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Saves the reminder setting for a specific habit.
 */
async function saveHabitReminderSetting(
  habitId: string,
  setting: { enabled: boolean; hour: number; minute: number }
) {
  const settings = await getHabitReminderSettings();
  settings[habitId] = setting;
  await AsyncStorage.setItem(HABIT_REMINDERS_KEY, JSON.stringify(settings));
}

/**
 * Restores all habit reminders from saved settings.
 * Call on app start after permissions are granted.
 */
export async function restoreHabitReminders(habits: { id: string; name: string }[]) {
  const settings = await getHabitReminderSettings();
  for (const habit of habits) {
    const setting = settings[habit.id];
    if (setting?.enabled) {
      await scheduleHabitReminder(habit.id, habit.name, setting.hour, setting.minute);
    }
  }
}

// ────────────────────────────────────────────────
// TASK REMINDERS
// ────────────────────────────────────────────────

/**
 * Schedules a reminder for a task at its due date (or a configurable time before).
 * Fires 1 hour before the due time, or at 9:00 AM on the due date if no time is set.
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueDate: string,
  scheduledStart?: string
) {
  const identifier = `${TASK_REMINDER_PREFIX}${taskId}`;

  // Cancel existing
  await cancelTaskReminder(taskId);

  let triggerDate: Date;

  if (scheduledStart) {
    // Remind 15 minutes before scheduled start
    triggerDate = new Date(scheduledStart);
    triggerDate.setMinutes(triggerDate.getMinutes() - 15);
  } else {
    // Remind at 9:00 AM on the due date
    triggerDate = new Date(dueDate);
    triggerDate.setHours(9, 0, 0, 0);
  }

  // Don't schedule if the reminder time has already passed
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `📋 Task Reminder`,
      body: taskTitle,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        channelId: REMINDER_CHANNEL_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Cancels the reminder for a specific task.
 */
export async function cancelTaskReminder(taskId: string) {
  const identifier = `${TASK_REMINDER_PREFIX}${taskId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

/**
 * Schedules reminders for all tasks with upcoming due dates.
 * Call on app start.
 */
export async function scheduleUpcomingTaskReminders(
  tasks: { id: string; title: string; dueDate?: string; scheduledStart?: string }[]
) {
  for (const task of tasks) {
    if (task.dueDate) {
      await scheduleTaskReminder(task.id, task.title, task.dueDate, task.scheduledStart);
    }
  }
}
