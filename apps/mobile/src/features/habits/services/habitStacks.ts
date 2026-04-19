import AsyncStorage from '@react-native-async-storage/async-storage';

const STACKS_KEY = 'habit_stacks';

type StackMap = Record<string, string>;

async function readAll(): Promise<StackMap> {
  try {
    const raw = await AsyncStorage.getItem(STACKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAll(map: StackMap): Promise<void> {
  await AsyncStorage.setItem(STACKS_KEY, JSON.stringify(map));
}

export async function getStackedHabitId(triggerId: string): Promise<string | null> {
  const map = await readAll();
  return map[triggerId] ?? null;
}

export async function getAllStacks(): Promise<StackMap> {
  return readAll();
}

export async function setStackedHabit(triggerId: string, stackedId: string | null): Promise<void> {
  const map = await readAll();
  if (stackedId) {
    map[triggerId] = stackedId;
  } else {
    delete map[triggerId];
  }
  await writeAll(map);
}

export async function removeHabitFromStacks(habitId: string): Promise<void> {
  const map = await readAll();
  let changed = false;
  if (habitId in map) {
    delete map[habitId];
    changed = true;
  }
  for (const k of Object.keys(map)) {
    if (map[k] === habitId) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) await writeAll(map);
}
