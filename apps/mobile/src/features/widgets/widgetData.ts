import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WidgetBridge from 'widget-bridge';

/**
 * Widget data bridge.
 *
 * Snapshot + pending actions are mirrored to:
 *   - AsyncStorage (JS fallback, always available, useful in dev/web)
 *   - Native shared storage via `widget-bridge` local Expo module:
 *       iOS:     App Group UserDefaults(suiteName: "group.com.indrox.theprimeway")
 *       Android: SharedPreferences("widget-data", MODE_PRIVATE)
 *
 * The native widget extension (iOS) / widget provider (Android) read from the
 * native store. Without the native bridge loaded (e.g. Expo Go, web), writes
 * fall back to AsyncStorage only and widgets show placeholder data.
 */

export const APP_GROUP_ID = 'group.com.indrox.theprimeway';

export interface WidgetTask {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  timeSlot?: string;
}

export interface WidgetHabit {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
}

export interface WidgetSnapshot {
  updatedAt: string;
  tasks: WidgetTask[];
  taskCompletedCount: number;
  taskTotal: number;
  currentStreak: number;
  longestStreak: number;
  nextHabit: WidgetHabit | null;
  pendingHabits: WidgetHabit[];
}

export interface PendingAction {
  id: string;
  kind: 'completeHabit' | 'completeTask';
  targetId: string;
  timestamp: string;
}

const KEY_SNAPSHOT = 'widget:snapshot';
const KEY_PENDING_ACTIONS = 'widget:pendingActions';

export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot);
  await AsyncStorage.setItem(KEY_SNAPSHOT, json);
  try {
    WidgetBridge.writeSnapshot(json);
  } catch {
    // Native module unavailable — JS fallback only
  }
}

export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  const raw = await AsyncStorage.getItem(KEY_SNAPSHOT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export async function readPendingActions(): Promise<PendingAction[]> {
  // Prefer native store — that's where widget check-ins land.
  let raw: string | null = null;
  try {
    raw = WidgetBridge.readPendingActions();
  } catch {
    raw = null;
  }
  if (!raw || raw === '[]') {
    raw = await AsyncStorage.getItem(KEY_PENDING_ACTIONS);
  }
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingAction[];
  } catch {
    return [];
  }
}

export async function clearPendingActions(): Promise<void> {
  await AsyncStorage.removeItem(KEY_PENDING_ACTIONS);
  try {
    WidgetBridge.clearPendingActions();
  } catch {
    // ignore
  }
}

export function reloadWidgets(): void {
  try {
    WidgetBridge.reloadWidgets();
  } catch {
    // ignore
  }
}
