import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'task_order_';

function key(dayKey: string) {
  return `${PREFIX}${dayKey}`;
}

export async function loadTaskOrder(dayKey: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key(dayKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveTaskOrder(dayKey: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(key(dayKey), JSON.stringify(ids));
}

export function applyTaskOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (!order.length) return items;
  const byId = new Map(items.map((it) => [it.id, it] as const));
  const ordered: T[] = [];
  for (const id of order) {
    const found = byId.get(id);
    if (found) {
      ordered.push(found);
      byId.delete(id);
    }
  }
  for (const remaining of byId.values()) ordered.push(remaining);
  return ordered;
}
