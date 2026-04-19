import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'task_subtasks_';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

function key(taskId: string) {
  return `${PREFIX}${taskId}`;
}

export async function loadSubtasks(taskId: string): Promise<Subtask[]> {
  try {
    const raw = await AsyncStorage.getItem(key(taskId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSubtasks(taskId: string, items: Subtask[]): Promise<void> {
  await AsyncStorage.setItem(key(taskId), JSON.stringify(items));
}

export async function deleteAllSubtasks(taskId: string): Promise<void> {
  await AsyncStorage.removeItem(key(taskId)).catch(() => {});
}
